import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import type RagChatPlugin from "./main";
import { getIndices, type ChatTurn, type FuzzySearchApi } from "./retriever";
import { answerQuestion } from "./workflow";

export const RAG_CHAT_VIEW_TYPE = "rag-chat-view";

export class RagChatView extends ItemView {
  plugin: RagChatPlugin;
  private turns: ChatTurn[] = [];
  private messagesEl!: HTMLElement;
  private inputEl!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private busy = false;
  /** Maps each turn to its rendered text element, so status/streaming
   * updates (fired once per token during generation) can patch just that
   * one element instead of tearing down and rebuilding the entire message
   * list - including re-binding every citation link's click handler - on
   * every chunk. A full renderTurns() is still used whenever the turn LIST
   * itself changes (new turn, citations attached). */
  private turnEls = new Map<ChatTurn, HTMLElement>();

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
   * fuzzy-search retrieval leg is best-effort, not a hard dependency. */
  private getFuzzySearchApi(): FuzzySearchApi | null {
    const plugins = (
      this.app as unknown as { plugins?: { plugins?: Record<string, { api?: FuzzySearchApi }> } }
    ).plugins?.plugins;
    return plugins?.["vault-search"]?.api ?? null;
  }

  private async handleSend() {
    if (this.busy) return;
    const question = this.inputEl.value.trim();
    if (!question) return;
    this.inputEl.value = "";

    // Snapshot the conversation BEFORE pushing this turn - real multi-turn
    // memory (see gemini.ts's buildHistoryContents / workflow.ts) needs the
    // prior turns, not the in-progress question/answer pair.
    const history = [...this.turns];
    this.turns.push({ role: "user", text: question });
    // Show immediate feedback (before any network call) instead of a blank
    // bubble - the workflow's own onStatus calls take over from here.
    const assistantTurn: ChatTurn = { role: "assistant", text: "", status: "Analysiere Frage …" };
    this.turns.push(assistantTurn);
    this.renderTurns();
    this.setBusy(true);

    try {
      await this.answer(question, history, assistantTurn);
    } catch (err) {
      assistantTurn.status = undefined;
      assistantTurn.text = `Fehler: ${err instanceof Error ? err.message : String(err)}`;
      // Don't show stale/misleading "Quellen" next to a failed generation -
      // retrieval may have succeeded before streamGenerate() rejected.
      assistantTurn.citations = [];
      new Notice(`RAG Chat error: ${err instanceof Error ? err.message : String(err)}`);
      this.renderTurns();
    } finally {
      this.setBusy(false);
    }
  }

  private async answer(question: string, history: ChatTurn[], turn: ChatTurn): Promise<void> {
    const { settings } = this.plugin;
    const manifest = await this.plugin.getManifest();
    const pluginDir = this.plugin.getPluginDirFullPath();
    const indices = await getIndices(pluginDir, manifest);
    const fuzzyApi = this.getFuzzySearchApi();

    // Both callbacks patch just this turn's DOM element (see updateTurnText)
    // instead of re-rendering the whole message list on every token/status
    // change - important since onChunk fires once per streamed token.
    const onChunk = (delta: string) => {
      turn.status = undefined;
      turn.text += delta;
      this.updateTurnText(turn);
    };
    const onStatus = (status: string) => {
      turn.status = status;
      this.updateTurnText(turn);
    };

    const result = await answerQuestion({
      question,
      history,
      settings,
      vault: this.app.vault,
      indices,
      fuzzyApi,
      onChunk,
      onStatus,
    });

    turn.citations = result.citations;
    if (result.citations.length === 0) {
      turn.status = undefined;
      turn.text = "Keine passenden Seiten im Handbuch gefunden.";
    }
    // Full re-render: citations (and their click handlers) need to be
    // attached now that retrieval has finished.
    this.renderTurns();
  }

  /** True while a turn should show its transient `status` label instead of
   * `text` (i.e. nothing has actually streamed in yet). */
  private showsStatus(turn: ChatTurn): boolean {
    return turn.role === "assistant" && turn.text.length === 0 && Boolean(turn.status);
  }

  private renderTurns() {
    this.messagesEl.empty();
    this.turnEls.clear();
    for (const turn of this.turns) {
      const turnEl = this.messagesEl.createDiv({ cls: `rag-chat-turn rag-chat-turn-${turn.role}` });
      const status = this.showsStatus(turn);
      const textEl = turnEl.createDiv({
        cls: status ? "rag-chat-turn-text rag-chat-turn-status" : "rag-chat-turn-text",
        text: status ? turn.status! : turn.text,
      });
      this.turnEls.set(turn, textEl);
      if (turn.citations && turn.citations.length > 0) {
        const citeEl = turnEl.createDiv({ cls: "rag-chat-citations" });
        citeEl.createSpan({ text: "Quellen: " });
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
    }
    this.messagesEl.scrollTo({ top: this.messagesEl.scrollHeight });
  }

  /** Lightweight in-place update for a single turn's visible text (status
   * label or streamed answer content) - avoids rebuilding the whole message
   * list (and re-binding every citation link) on every token/status change.
   * Falls back to a full renderTurns() if the turn has no cached element yet. */
  private updateTurnText(turn: ChatTurn) {
    const el = this.turnEls.get(turn);
    if (!el) {
      this.renderTurns();
      return;
    }
    const status = this.showsStatus(turn);
    el.classList.toggle("rag-chat-turn-status", status);
    el.textContent = status ? turn.status! : turn.text;
    this.messagesEl.scrollTo({ top: this.messagesEl.scrollHeight });
  }
}
