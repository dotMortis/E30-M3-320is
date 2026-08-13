import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import type RagChatPlugin from "./main";
import {
  buildContextXml,
  embedQuery,
  expandToParentNotes,
  getIndex,
  hybridSearch,
  type ContextBlock,
} from "./retriever";
import { streamGenerate } from "./gemini";

export const RAG_CHAT_VIEW_TYPE = "rag-chat-view";

interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  citations?: ContextBlock[];
}

export class RagChatView extends ItemView {
  plugin: RagChatPlugin;
  private turns: ChatTurn[] = [];
  private messagesEl!: HTMLElement;
  private inputEl!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private busy = false;

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

  private async handleSend() {
    if (this.busy) return;
    const question = this.inputEl.value.trim();
    if (!question) return;
    this.inputEl.value = "";

    this.turns.push({ role: "user", text: question });
    const assistantTurn: ChatTurn = { role: "assistant", text: "" };
    this.turns.push(assistantTurn);
    this.renderTurns();
    this.setBusy(true);

    try {
      await this.answer(question, assistantTurn);
    } catch (err) {
      assistantTurn.text = `Fehler: ${err instanceof Error ? err.message : String(err)}`;
      new Notice(`RAG Chat error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.setBusy(false);
      this.renderTurns();
    }
  }

  private async answer(question: string, turn: ChatTurn): Promise<void> {
    const { settings } = this.plugin;
    const manifest = await this.plugin.getManifest();
    const indexPath = this.plugin.getIndexPath();

    const [vector, db] = await Promise.all([embedQuery(question, settings), getIndex(indexPath)]);
    const hits = await hybridSearch(db, question, vector, settings);
    const contextBlocks = await expandToParentNotes(hits, this.app.vault);
    turn.citations = contextBlocks;

    if (contextBlocks.length === 0) {
      turn.text = "Keine passenden Seiten im Handbuch gefunden.";
      this.renderTurns();
      return;
    }

    const contextXml = buildContextXml(contextBlocks);
    await streamGenerate(contextXml, question, settings, (delta) => {
      turn.text += delta;
      this.renderTurns();
    });
    void manifest; // manifest already validated on load; kept for future staleness UI
  }

  private renderTurns() {
    this.messagesEl.empty();
    for (const turn of this.turns) {
      const turnEl = this.messagesEl.createDiv({ cls: `rag-chat-turn rag-chat-turn-${turn.role}` });
      turnEl.createDiv({ cls: "rag-chat-turn-text", text: turn.text });
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
}
