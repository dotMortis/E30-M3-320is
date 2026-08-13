import { ItemView, Keymap, MarkdownRenderer, Notice, WorkspaceLeaf } from "obsidian";
import type RagChatPlugin from "./main";
import type { PendingAgentState } from "./agent";
import { getIndices, type ChatTurn, type FuzzySearchApi } from "./retriever";
import { answerQuestion, continueAnswer, type WorkflowResult } from "./workflow";
import { buildWebCitationSnippets, linkifyCitations, linkifyWebCitations } from "./citation-links";

export const RAG_CHAT_VIEW_TYPE = "rag-chat-view";

export class RagChatView extends ItemView {
  plugin: RagChatPlugin;
  private turns: ChatTurn[] = [];
  private messagesEl!: HTMLElement;
  private inputEl!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private busy = false;
  /** Maps each turn to its rendered text element, so status updates (fired
   * once per agent-loop round) can patch just that one element instead of
   * tearing down and rebuilding the entire message list on every round. A
   * full renderTurns() is still used whenever the turn LIST itself changes
   * (new turn, final answer + citations attached). */
  private turnEls = new Map<ChatTurn, HTMLElement>();
  /** The inner <ul> of each turn's collapsed "Rechercheverlauf" <details>
   * block (see renderTurns()), so updateTurnStatus() can append a new line
   * incrementally per round instead of a full re-render - same perf
   * rationale as turnEls above. */
  private turnLogListEls = new Map<ChatTurn, HTMLElement>();
  /** The <summary> element of that same <details> block, so its "(N
   * Schritte)" count can be bumped in place alongside each appended line. */
  private turnLogSummaryEls = new Map<ChatTurn, HTMLElement>();
  /** Non-null while the model has paused mid-turn on an ask_user tool call
   * (see agent.ts) awaiting your reply. The next message you send is routed
   * through continueAnswer() to resume the SAME agent loop instead of
   * starting an independent new turn - see handleSend(). Lives only in
   * memory for this session (not persisted across plugin reloads). */
  private pendingAgentState: PendingAgentState | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: RagChatPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return RAG_CHAT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "RAG Chat";
  }

  getIcon(): string {
    return "message-circle-question";
  }

  async onOpen(): Promise<void> {
    const container = this.contentEl;
    container.empty();
    container.addClass("rag-chat-container");

    this.messagesEl = container.createDiv({ cls: "rag-chat-messages" });

    const inputRow = container.createDiv({ cls: "rag-chat-input-row" });
    this.inputEl = inputRow.createEl("textarea", {
      cls: "rag-chat-input",
      attr: { placeholder: "Frage zum Handbuch stellen... (z.B. Anzugsdrehmoment Zylinderkopf)" },
    });
    this.inputEl.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        this.handleSend();
      }
    });

    this.sendButton = inputRow.createEl("button", { cls: "rag-chat-send", text: "Fragen" });
    this.sendButton.addEventListener("click", () => this.handleSend());

    this.renderTurns();
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }

  private setBusy(busy: boolean) {
    this.busy = busy;
    this.sendButton.disabled = busy;
    this.sendButton.setText(busy ? "..." : "Fragen");
  }

  /** Looks up Vault Search's public search API (see that plugin's onload()),
   * if the plugin is installed and enabled. Returns null otherwise - the
   * fuzzy-search tool is best-effort, not a hard dependency. */
  private getFuzzySearchApi(): FuzzySearchApi | null {
    const plugins = (
      this.app as unknown as { plugins?: { plugins?: Record<string, { api?: FuzzySearchApi }> } }
    ).plugins?.plugins;
    return plugins?.["vault-search"]?.api ?? null;
  }

  private async handleSend() {
    if (this.busy) return;
    const message = this.inputEl.value.trim();
    if (!message) return;
    this.inputEl.value = "";

    const isResuming = this.pendingAgentState !== null;

    // Snapshot the conversation BEFORE pushing this turn - real multi-turn
    // memory (see gemini.ts's buildHistoryContents) needs the prior turns,
    // not the in-progress question/answer pair. Not used when resuming a
    // paused agent loop, since that loop already carries its own contents.
    const history = [...this.turns];
    this.turns.push({ role: "user", text: message });
    const assistantTurn: ChatTurn = {
      role: "assistant",
      text: "",
      status: isResuming ? "Setze Suche fort …" : "Analysiere Frage …",
    };
    this.turns.push(assistantTurn);
    this.renderTurns();
    this.setBusy(true);

    try {
      await this.answer(message, history, assistantTurn, isResuming);
    } catch (err) {
      this.pendingAgentState = null;
      assistantTurn.status = undefined;
      assistantTurn.text = `Fehler: ${err instanceof Error ? err.message : String(err)}`;
      assistantTurn.citations = [];
      assistantTurn.webCitations = [];
      assistantTurn.webGroundingChunks = [];
      assistantTurn.webGroundingSupports = [];
      new Notice(`RAG Chat error: ${err instanceof Error ? err.message : String(err)}`);
      this.renderTurns();
    } finally {
      this.setBusy(false);
      this.updateInputPlaceholder();
    }
  }

  private updateInputPlaceholder() {
    this.inputEl.placeholder =
      this.pendingAgentState !== null
        ? "Antwort auf die Rückfrage …"
        : "Frage zum Handbuch stellen... (z.B. Anzugsdrehmoment Zylinderkopf)";
  }

  private async answer(message: string, history: ChatTurn[], turn: ChatTurn, isResuming: boolean): Promise<void> {
    const onStatus = (status: string) => {
      turn.status = status;
      (turn.statusLog ??= []).push(status);
      this.updateTurnStatus(turn);
    };

    let result: WorkflowResult;
    if (isResuming && this.pendingAgentState) {
      const pending = this.pendingAgentState;
      this.pendingAgentState = null;
      result = await continueAnswer(pending, message);
    } else {
      const { settings } = this.plugin;
      const manifest = await this.plugin.getManifest();
      const pluginDir = this.plugin.getPluginDirFullPath();
      const indices = await getIndices(pluginDir, manifest);
      const fuzzyApi = this.getFuzzySearchApi();
      result = await answerQuestion({
        question: message,
        history,
        settings,
        vault: this.app.vault,
        indices,
        fuzzyApi,
        onStatus,
      });
    }

    turn.status = undefined;
    if (result.status === "awaiting_clarification") {
      this.pendingAgentState = result.pending;
      turn.text = result.question;
      turn.isClarifying = true;
      turn.citations = [];
      turn.webCitations = [];
      turn.webGroundingChunks = [];
      turn.webGroundingSupports = [];
    } else {
      turn.text = result.text.trim() || "Ich habe leider keine Antwort erhalten.";
      turn.isClarifying = false;
      turn.citations = result.manualCitations;
      turn.webCitations = result.webCitations;
      turn.webGroundingChunks = result.webGroundingChunks;
      turn.webGroundingSupports = result.webGroundingSupports;
    }
    // Full re-render: citations (and their click handlers) need to be
    // attached now that the agent loop has finished (or paused).
    this.renderTurns();
  }

  /** True while a turn should show its transient `status` label instead of
   * `text` (i.e. nothing has actually arrived yet). */
  private showsStatus(turn: ChatTurn): boolean {
    return turn.role === "assistant" && turn.text.length === 0 && Boolean(turn.status);
  }

  private renderTurns() {
    this.messagesEl.empty();
    this.turnEls.clear();
    this.turnLogListEls.clear();
    this.turnLogSummaryEls.clear();
    for (const turn of this.turns) {
      const cls = ["rag-chat-turn", `rag-chat-turn-${turn.role}`];
      if (turn.isClarifying) cls.push("rag-chat-turn-clarifying");
      const turnEl = this.messagesEl.createDiv({ cls: cls.join(" ") });

      const status = this.showsStatus(turn);
      const textEl = turnEl.createDiv({ cls: status ? "rag-chat-turn-text rag-chat-turn-status" : "rag-chat-turn-text" });
      this.turnEls.set(turn, textEl);

      if (status) {
        textEl.setText(turn.status!);
      } else if (turn.role === "assistant" && turn.text) {
        // Assistant answers use the labeled-section structure from the
        // system prompt (headers/bold for "Aus dem Werkstatthandbuch" vs.
        // "Zusätzliches Wissen ...") - render as Markdown so that structure
        // is actually visible instead of showing literal "**...**"/"##...".
        // Two linkify passes run on the PRISTINE model text before
        // rendering (order matters: web citations first, since manual-page
        // citations only touch "[Seite ...]" substrings and shouldn't see
        // each other's output):
        //  1. Web sources (Google Search grounding) get wrapped around the
        //     actual cited line in the text (see citation-links.ts's
        //     linkifyWebCitations) instead of only appearing in the opaque
        //     "Quellen (Web)" list below.
        //  2. Manual "[Seite ...]" citations become real Obsidian
        //     wikilinks (see linkifyCitations).
        const withWebLinks = linkifyWebCitations(turn.text, turn.webGroundingChunks ?? [], turn.webGroundingSupports ?? []);
        const renderedText = linkifyCitations(withWebLinks, turn.citations ?? []);
        void MarkdownRenderer.render(this.app, renderedText, textEl, "", this).then(() => {
          this.wireInternalLinks(textEl);
        });
      } else {
        textEl.setText(turn.text);
      }

      if (turn.isClarifying) {
        turnEl.createDiv({ cls: "rag-chat-clarifying-hint", text: "Antworte unten, um fortzufahren." });
      }

      if (turn.citations && turn.citations.length > 0) {
        const citeEl = turnEl.createDiv({ cls: "rag-chat-citations" });
        citeEl.createSpan({ text: "Quellen (Handbuch): " });
        for (const block of turn.citations) {
          const link = citeEl.createEl("a", {
            cls: "rag-chat-citation-link",
            text: `${block.seitencode} (${block.sektion})`,
          });
          link.addEventListener("click", (evt) => {
            evt.preventDefault();
            void this.app.workspace.openLinkText(block.notePath, "", false);
          });
        }
      }

      if (turn.webCitations && turn.webCitations.length > 0) {
        // Fallback/complete list - most entries are already linked inline
        // above (see linkifyWebCitations), but this stays as a reference
        // for any chunk without a matching groundingSupport, or if inline
        // linking was skipped. Google's own chunk titles are usually just a
        // bare domain (e.g. "youtube.com" for every single entry) with
        // nothing to tell them apart, so each link is paired with the
        // actual cited excerpt (see buildWebCitationSnippets) where available.
        const snippets = buildWebCitationSnippets(turn.webGroundingChunks ?? [], turn.webGroundingSupports ?? []);
        const webCiteEl = turnEl.createDiv({ cls: "rag-chat-citations rag-chat-web-citations" });
        webCiteEl.createSpan({ text: "Quellen (Web): " });
        for (const web of turn.webCitations) {
          const row = webCiteEl.createSpan({ cls: "rag-chat-web-citation-row" });
          row.createEl("a", {
            cls: "rag-chat-citation-link rag-chat-web-citation-link",
            text: web.title || web.uri,
            attr: { href: web.uri, target: "_blank", rel: "noopener" },
          });
          const snippet = snippets.get(web.uri);
          if (snippet) {
            row.createSpan({ cls: "rag-chat-web-citation-snippet", text: ` – "${snippet}"` });
          }
        }
      }

      if (turn.statusLog && turn.statusLog.length > 0) {
        this.renderStatusLog(turnEl, turn);
      }
    }
    this.messagesEl.scrollTo({ top: this.messagesEl.scrollHeight });
  }

  /**
   * Attaches click/hover behavior to every `a.internal-link` rendered by
   * MarkdownRenderer.render() inside `el` - a real Obsidian gotcha, not a
   * bug in the rendered HTML: MarkdownRenderer.render() only produces
   * static `<a class="internal-link">` markup, but Obsidian's automatic
   * click-to-navigate/hover-to-preview behavior is only wired up for real
   * MarkdownView/reading-view panes, NOT for custom ItemViews like this
   * one (confirmed via the Obsidian forum and multiple production plugins
   * hitting this exact issue - e.g. forum.obsidian.md/t/internal-links-
   * dont-work-in-custom-view/90169). Without this, rendered wikilinks
   * (see citation-links.ts) look right but silently do nothing on click.
   * `<details class="rag-chat-citation-ambiguous">` candidate links (see
   * linkifyCitations) are plain internal-links too, so they're covered by
   * this same pass with no extra code.
   */
  private wireInternalLinks(el: HTMLElement): void {
    const sourcePath = "";
    el.querySelectorAll<HTMLAnchorElement>("a.internal-link").forEach((a) => {
      a.addEventListener("click", (evt: MouseEvent) => {
        evt.preventDefault();
        const href = a.getAttribute("href");
        if (href) void this.app.workspace.openLinkText(href, sourcePath, Keymap.isModEvent(evt));
      });
      a.addEventListener("mouseover", (evt: MouseEvent) => {
        const href = a.getAttribute("href");
        if (!href) return;
        this.app.workspace.trigger("hover-link", {
          event: evt,
          source: "preview",
          hoverParent: { hoverPopover: null },
          targetEl: a,
          linktext: href,
          sourcePath,
        });
      });
    });
  }

  /** Renders a turn's accumulated status trail (baseline retrieval hit
   * count, per-round tool calls + outcomes, retry countdowns - see
   * agent.ts/workflow.ts's onStatus calls) as a collapsed-by-default
   * <details> block, so it's available to explain *why* a question took
   * several rounds without cluttering the answer by default. Stays
   * attached (and reviewable) after the turn finishes, not just while it's
   * in progress. */
  private renderStatusLog(turnEl: HTMLElement, turn: ChatTurn) {
    const log = turn.statusLog!;
    const details = turnEl.createEl("details", { cls: "rag-chat-status-log" });
    const summary = details.createEl("summary", { text: `Rechercheverlauf (${log.length} Schritte)` });
    const list = details.createEl("ul", { cls: "rag-chat-status-log-list" });
    for (const line of log) {
      list.createEl("li", { cls: "rag-chat-status-log-item", text: line });
    }
    this.turnLogListEls.set(turn, list);
    this.turnLogSummaryEls.set(turn, summary);
  }

  /** Lightweight in-place update for a single turn's transient status label
   * (fired once per agent-loop round) - avoids rebuilding the whole message
   * list on every round. Falls back to a full renderTurns() if the turn has
   * no cached element yet. */
  private updateTurnStatus(turn: ChatTurn) {
    const el = this.turnEls.get(turn);
    if (!el) {
      this.renderTurns();
      return;
    }
    if (this.showsStatus(turn)) {
      el.classList.add("rag-chat-turn-status");
      el.setText(turn.status!);
      this.messagesEl.scrollTo({ top: this.messagesEl.scrollHeight });
    }
    this.appendStatusLogLine(turn);
  }

  /** Appends just the newest statusLog entry to a turn's already-rendered
   * "Rechercheverlauf" <details> block (see renderStatusLog) - mirrors the
   * patch-not-rebuild approach above for the status label itself. Falls
   * back to a full renderTurns() the first time a turn gets a status line
   * at all (no <details> block exists yet to append into). */
  private appendStatusLogLine(turn: ChatTurn) {
    const log = turn.statusLog;
    if (!log || log.length === 0) return;
    const list = this.turnLogListEls.get(turn);
    const summary = this.turnLogSummaryEls.get(turn);
    if (!list || !summary) {
      this.renderTurns();
      return;
    }
    list.createEl("li", { cls: "rag-chat-status-log-item", text: log[log.length - 1] });
    summary.setText(`Rechercheverlauf (${log.length} Schritte)`);
  }
}
