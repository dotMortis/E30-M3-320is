import { ItemView, Notice, type WorkspaceLeaf } from "obsidian";
import type RagChatPlugin from "../main";
import { getIndices } from "../retrieval/index-cache";
import {
  abandonPendingClarification,
  createChatSessionState,
  inputPlaceholder,
  sendMessage,
  type ChatSessionState,
} from "./controller";
import { getFuzzySearchApi } from "./fuzzy-search-plugin";
import { appendNewTurns, renderTurns, unloadAllTurns, updateTurn, type RenderTurnsResult } from "./render-turns";
import type { ChatTurn } from "../retrieval/types";

export const RAG_CHAT_VIEW_TYPE = "rag-chat-view";

function emptyRenderResult(): RenderTurnsResult {
  return {
    turnEls: new Map(),
    turnContainers: new Map(),
    statusLogElements: new Map(),
    markdownComponents: new Map(),
  };
}

export class RagChatView extends ItemView {
  plugin: RagChatPlugin;
  private session: ChatSessionState = createChatSessionState();
  private messagesEl!: HTMLElement;
  private inputEl!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private cancelClarificationButton!: HTMLButtonElement;
  private busy = false;
  private rendered: RenderTurnsResult = emptyRenderResult();
  /** True once onClose()/onunload() has run - gates all UI-touching
   * callbacks so a settling promise from a request started before close
   * doesn't touch a torn-down view (stray Notice, rerender into an emptied
   * contentEl, etc). */
  private closed = false;
  /** Aborted on close (or when a new send starts) so an abandoned request's
   * agent loop stops taking further rounds. Obsidian's requestUrl has no
   * cancellation support, so an already-in-flight HTTP call itself can't be
   * aborted - this only stops the *next* round from starting. */
  private abortController: AbortController | null = null;

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
    this.closed = false;
    const container = this.contentEl;
    container.empty();
    container.addClass("rag-chat-container");

    this.messagesEl = container.createDiv({ cls: "rag-chat-messages" });

    const clarificationRow = container.createDiv({ cls: "rag-chat-clarification-row" });
    this.cancelClarificationButton = clarificationRow.createEl("button", {
      cls: "rag-chat-cancel-clarification rag-chat-hidden",
      text: "Rückfrage abbrechen",
    });
    this.registerDomEvent(this.cancelClarificationButton, "click", () => {
      abandonPendingClarification(this.session);
      this.updateClarificationAffordance();
      this.inputEl.placeholder = inputPlaceholder(this.session);
    });

    const inputRow = container.createDiv({ cls: "rag-chat-input-row" });
    this.inputEl = inputRow.createEl("textarea", {
      cls: "rag-chat-input",
      attr: { placeholder: "Frage zum Handbuch stellen... (z.B. Anzugsdrehmoment Zylinderkopf)" },
    });
    this.registerDomEvent(this.inputEl, "keydown", (evt) => {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        void this.handleSend();
      }
    });

    this.sendButton = inputRow.createEl("button", { cls: "rag-chat-send", text: "Fragen" });
    this.registerDomEvent(this.sendButton, "click", () => void this.handleSend());

    this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this);
    this.updateClarificationAffordance();
  }

  async onClose(): Promise<void> {
    this.closed = true;
    this.abortController?.abort();
    unloadAllTurns(this.rendered);
    this.contentEl.empty();
  }

  onunload(): void {
    this.closed = true;
    this.abortController?.abort();
  }

  /** Resets the conversation (turns + any pending clarification) and
   * re-renders an empty message list. Backs the "RAG: Chat leeren" command. */
  clearChat(): void {
    this.abortController?.abort();
    unloadAllTurns(this.rendered);
    this.session = createChatSessionState();
    this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this);
    this.updateClarificationAffordance();
    this.inputEl.placeholder = inputPlaceholder(this.session);
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.sendButton.disabled = busy;
    this.sendButton.setText(busy ? "..." : "Fragen");
  }

  private updateClarificationAffordance(): void {
    this.cancelClarificationButton.toggleClass("rag-chat-hidden", this.session.pendingAgentState === null);
  }

  private syncTurn(turn: ChatTurn): void {
    if (!updateTurn(this.messagesEl, turn, this.app, this, this.rendered)) {
      appendNewTurns(this.messagesEl, this.session.turns, this.app, this, this.rendered);
    }
  }

  private async handleSend(): Promise<void> {
    if (this.busy) return;
    const message = this.inputEl.value.trim();
    if (!message) return;
    this.inputEl.value = "";
    this.setBusy(true);

    const controller = new AbortController();
    this.abortController = controller;

    let currentTurn: ChatTurn | null = null;
    try {
      await sendMessage(this.session, message, {
        settings: this.plugin.settings,
        vault: this.app.vault,
        getIndices: async () => getIndices(this.plugin.getPluginDirFullPath(), await this.plugin.getManifest()),
        getFuzzyApi: () => getFuzzySearchApi(this.app),
        signal: controller.signal,
        onTurnStarted: (turn) => {
          if (this.closed) return;
          currentTurn = turn;
          appendNewTurns(this.messagesEl, this.session.turns, this.app, this, this.rendered);
        },
        onStatus: () => {
          if (this.closed || !currentTurn) return;
          this.syncTurn(currentTurn);
        },
        onError: (message) => {
          if (this.closed) return;
          new Notice(`RAG Chat error: ${message}`);
        },
      });
    } finally {
      if (this.abortController === controller) this.abortController = null;
      if (!this.closed) {
        if (currentTurn) this.syncTurn(currentTurn);
        this.updateClarificationAffordance();
        this.setBusy(false);
        this.inputEl.placeholder = inputPlaceholder(this.session);
      }
    }
  }
}
