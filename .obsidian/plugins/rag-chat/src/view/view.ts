import { ItemView, Notice, type WorkspaceLeaf } from "obsidian";
import type RagChatPlugin from "../main";
import { getIndices } from "../retrieval/index-cache";
import { createChatSessionState, inputPlaceholder, sendMessage, type ChatSessionState } from "./controller";
import { getFuzzySearchApi } from "./fuzzy-search-plugin";
import { renderTurns, type RenderTurnsResult } from "./render-turns";
import { appendStatusLogLine } from "./render-status-log";
import type { ChatTurn } from "../retrieval/types";

export const RAG_CHAT_VIEW_TYPE = "rag-chat-view";

export class RagChatView extends ItemView {
  plugin: RagChatPlugin;
  private session: ChatSessionState = createChatSessionState();
  private messagesEl!: HTMLElement;
  private inputEl!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private busy = false;
  private rendered: RenderTurnsResult = { turnEls: new Map(), statusLogElements: new Map() };

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
        void this.handleSend();
      }
    });

    this.sendButton = inputRow.createEl("button", { cls: "rag-chat-send", text: "Fragen" });
    this.sendButton.addEventListener("click", () => void this.handleSend());

    this.rerender();
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.sendButton.disabled = busy;
    this.sendButton.setText(busy ? "..." : "Fragen");
  }

  private rerender(): void {
    this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this);
  }

  private updateTurnStatus(turn: ChatTurn): void {
    const el = this.rendered.turnEls.get(turn);
    if (!el) {
      this.rerender();
      return;
    }
    if (turn.role === "assistant" && turn.text.length === 0 && turn.status) {
      el.classList.add("rag-chat-turn-status");
      el.setText(turn.status);
      this.messagesEl.scrollTo({ top: this.messagesEl.scrollHeight });
    }
    const logElements = this.rendered.statusLogElements.get(turn);
    if (!logElements) {
      this.rerender();
      return;
    }
    appendStatusLogLine(logElements, turn);
  }

  private async handleSend(): Promise<void> {
    if (this.busy) return;
    const message = this.inputEl.value.trim();
    if (!message) return;
    this.inputEl.value = "";
    this.setBusy(true);

    let currentTurn: ChatTurn | null = null;
    try {
      await sendMessage(this.session, message, {
        settings: this.plugin.settings,
        vault: this.app.vault,
        getIndices: async () => getIndices(this.plugin.getPluginDirFullPath(), await this.plugin.getManifest()),
        getFuzzyApi: () => getFuzzySearchApi(this.app),
        onTurnStarted: (turn) => {
          currentTurn = turn;
          this.rerender();
        },
        onStatus: () => {
          if (currentTurn) this.updateTurnStatus(currentTurn);
        },
        onError: (message) => {
          new Notice(`RAG Chat error: ${message}`);
        },
      });
    } finally {
      this.rerender();
      this.setBusy(false);
      this.inputEl.placeholder = inputPlaceholder(this.session);
    }
  }
}
