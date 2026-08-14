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
import { confirmModal } from "./confirm-modal";
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
  private closed = false;
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

    const toolbarRow = container.createDiv({ cls: "rag-chat-toolbar-row" });
    const clearButton = toolbarRow.createEl("button", { cls: "rag-chat-clear-button", text: "Chat leeren" });
    this.registerDomEvent(clearButton, "click", () => {
      void this.handleClearClick();
    });

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
    this.registerDomEvent(this.sendButton, "click", () => {
      if (this.busy) {
        void this.handleCancelClick();
      } else {
        void this.handleSend();
      }
    });

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

  clearChat(): void {
    this.abortController?.abort();
    unloadAllTurns(this.rendered);
    this.session = createChatSessionState();
    this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this);
    this.updateClarificationAffordance();
    this.inputEl.placeholder = inputPlaceholder(this.session);
  }

  private async handleClearClick(): Promise<void> {
    const confirmed = await confirmModal(this.app, "Chat leeren? Der bisherige Verlauf geht verloren.");
    if (this.closed) return;
    if (confirmed) this.clearChat();
    this.inputEl.focus();
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.sendButton.setText(busy ? "Abbrechen" : "Fragen");
  }

  private async handleCancelClick(): Promise<void> {
    const confirmed = await confirmModal(this.app, "Anfrage wirklich abbrechen?");
    if (this.closed) return;
    if (confirmed) this.abortController?.abort();
    this.inputEl.focus();
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
    let cancelled = false;
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
        onCancelled: (originalMessage) => {
          cancelled = true;
          if (this.closed) return;
          unloadAllTurns(this.rendered);
          this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this);
          this.inputEl.value = originalMessage;
          this.inputEl.focus();
          new Notice("Anfrage abgebrochen.");
        },
      });
    } finally {
      if (this.abortController === controller) this.abortController = null;
      if (!this.closed) {
        if (!cancelled && currentTurn) this.syncTurn(currentTurn);
        this.updateClarificationAffordance();
        this.setBusy(false);
        this.inputEl.placeholder = inputPlaceholder(this.session);
      }
    }
  }
}
