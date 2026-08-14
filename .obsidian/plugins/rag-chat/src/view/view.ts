import { ItemView, Notice, type WorkspaceLeaf } from "obsidian";
import type RagChatPlugin from "../main";
import { getIndices } from "../retrieval/index-cache";
import type { ChatTurn } from "../retrieval/types";
import { confirmModal } from "./confirm-modal";
import {
  abandonPendingClarification,
  createChatSessionState,
  discardFailedTurn,
  inputPlaceholder,
  retryTurn,
  sendMessage,
  type ChatSessionState,
  type SendMessageDeps,
} from "./controller";
import { getFuzzySearchApi } from "./fuzzy-search-plugin";
import { refreshModelOptions } from "./model-options";
import type { TurnActionCallbacks } from "./render-turn-actions";
import {
  appendNewTurns,
  renderTurns,
  unloadAllTurns,
  updateTurn,
  updateTurnLive,
  type RenderTurnsResult,
} from "./render-turns";
import { TtsControlsController } from "./tts-controls-controller";
import { TurnSpeech } from "./turn-speech";
import { buildComposer, type ComposerElements } from "./ui/composer";
import { buildToolbar, type ToolbarElements } from "./ui/toolbar";
import { buildTtsControls, type TtsControlsElements } from "./ui/tts-controls";

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
  private toolbar!: ToolbarElements;
  private composer!: ComposerElements;
  private ttsControls!: TtsControlsElements;
  private ttsController!: TtsControlsController;
  private busy = false;
  private rendered: RenderTurnsResult = emptyRenderResult();
  private closed = false;
  private abortController: AbortController | null = null;
  private readonly speech = new TurnSpeech({
    plugin: () => this.plugin,
    isClosed: () => this.closed,
    syncTurn: (turn) => this.syncTurn(turn),
    onCharCounterChanged: () => this.ttsController.updateCharCounter(),
  });
  private readonly turnCallbacks: TurnActionCallbacks = {
    onRetry: (turn) => void this.handleRetryClick(turn),
    onDelete: (turn) => this.handleDeleteClick(turn),
    onSpeak: (turn) => void this.speech.handleSpeakClick(turn),
    isSpeaking: (turn) => this.speech.isSpeaking(turn),
  };

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

    this.toolbar = buildToolbar(container);
    this.messagesEl = container.createDiv({ cls: "rag-chat-messages" });
    this.composer = buildComposer(container);
    this.ttsControls = buildTtsControls(container);
    this.ttsController = new TtsControlsController(
      this.ttsControls,
      this.plugin,
      () => this.closed,
      () => this.busy,
    );

    this.wireToolbar();
    this.wireComposer();
    this.wireTtsControls();

    this.composer.thinkingCheckboxEl.checked = this.plugin.settings.thinkingEnabled;
    this.composer.webSearchCheckboxEl.checked = this.plugin.settings.webSearchEnabled;
    this.composer.ttsCheckboxEl.checked = this.plugin.settings.ttsEnabled;
    this.ttsController.syncFromSettings();
    void this.ttsController.refreshDevices();

    this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this, this.turnCallbacks);
    this.updateClarificationAffordance();
    void this.refreshModelOptions();
  }

  private wireToolbar(): void {
    this.registerDomEvent(this.toolbar.modelSelectEl, "change", () => void this.handleModelChange());
    this.registerDomEvent(this.toolbar.modelRefreshButton, "click", () => void this.refreshModelOptions());
    this.registerDomEvent(this.toolbar.clearButton, "click", () => void this.handleClearClick());
  }

  private wireComposer(): void {
    const c = this.composer;
    this.registerDomEvent(c.cancelClarificationButton, "click", () => {
      abandonPendingClarification(this.session);
      this.updateClarificationAffordance();
      c.inputEl.placeholder = inputPlaceholder(this.session);
    });
    this.registerDomEvent(c.inputEl, "keydown", (evt) => {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        void this.handleSend();
      }
    });
    this.registerDomEvent(c.sendButton, "click", () => {
      if (this.busy) void this.handleCancelClick();
      else void this.handleSend();
    });
    this.registerDomEvent(c.thinkingCheckboxEl, "change", () => {
      this.plugin.settings.thinkingEnabled = c.thinkingCheckboxEl.checked;
      void this.plugin.saveSettings();
    });
    this.registerDomEvent(c.webSearchCheckboxEl, "change", () => {
      this.plugin.settings.webSearchEnabled = c.webSearchCheckboxEl.checked;
      void this.plugin.saveSettings();
    });
    this.registerDomEvent(c.ttsCheckboxEl, "change", () => {
      this.plugin.settings.ttsEnabled = c.ttsCheckboxEl.checked;
      void this.plugin.saveSettings();
      this.ttsController.updateVisibility();
    });
  }

  private wireTtsControls(): void {
    const t = this.ttsControls;
    this.registerDomEvent(t.deviceSelectEl, "change", () => void this.ttsController.commitDevice());
    this.registerDomEvent(t.deviceRefreshButton, "click", () => void this.ttsController.refreshDevices());
    this.registerDomEvent(t.volumeSliderEl, "input", () => this.ttsController.onVolumeInput());
    this.registerDomEvent(t.volumeSliderEl, "change", () => void this.ttsController.commitVolume());
  }

  async onClose(): Promise<void> {
    this.closed = true;
    this.abortController?.abort();
    this.speech.stop();
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
    this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this, this.turnCallbacks);
    this.updateClarificationAffordance();
    this.composer.inputEl.placeholder = inputPlaceholder(this.session);
  }

  private async handleClearClick(): Promise<void> {
    const confirmed = await confirmModal(this.app, "Chat leeren? Der bisherige Verlauf geht verloren.");
    if (this.closed) return;
    if (confirmed) this.clearChat();
    this.composer.inputEl.focus();
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.composer.sendButton.setText(busy ? "Abbrechen" : "Fragen");
    this.toolbar.modelSelectEl.disabled = busy;
    this.toolbar.modelRefreshButton.disabled = busy;
  }

  private refreshModelOptions(): Promise<void> {
    return refreshModelOptions({
      selectEl: this.toolbar.modelSelectEl,
      apiKey: this.plugin.settings.geminiApiKey,
      currentModel: this.plugin.settings.generationModel,
      isClosed: () => this.closed,
      isBusy: () => this.busy,
      setDisabled: (disabled) => {
        this.toolbar.modelRefreshButton.disabled = disabled;
      },
    });
  }

  private async handleModelChange(): Promise<void> {
    const value = this.toolbar.modelSelectEl.value;
    if (!value || value === this.plugin.settings.generationModel) return;
    this.plugin.settings.generationModel = value;
    await this.plugin.saveSettings();
  }

  private async handleCancelClick(): Promise<void> {
    const confirmed = await confirmModal(this.app, "Anfrage wirklich abbrechen?");
    if (this.closed) return;
    if (confirmed) this.abortController?.abort();
    this.composer.inputEl.focus();
  }

  private updateClarificationAffordance(): void {
    this.composer.cancelClarificationButton.toggleClass(
      "rag-chat-hidden",
      this.session.pendingAgentState === null,
    );
  }

  private syncTurn(turn: ChatTurn): void {
    if (!updateTurn(this.messagesEl, turn, this.app, this, this.rendered, this.turnCallbacks)) {
      appendNewTurns(this.messagesEl, this.session.turns, this.app, this, this.rendered, this.turnCallbacks);
    }
  }

  private syncTurnLive(turn: ChatTurn): void {
    if (!updateTurnLive(turn, this.rendered, this.messagesEl)) {
      this.syncTurn(turn);
    }
  }

  private rebuildTurns(): void {
    unloadAllTurns(this.rendered);
    this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this, this.turnCallbacks);
  }

  private async runChatAction(
    action: (deps: SendMessageDeps) => Promise<void>,
    opts?: { fullRerenderOnStart?: boolean },
  ): Promise<void> {
    if (this.busy) return;
    this.setBusy(true);

    const controller = new AbortController();
    this.abortController = controller;

    let currentTurn: ChatTurn | null = null;
    let cancelled = false;
    try {
      await action({
        settings: this.plugin.settings,
        vault: this.app.vault,
        getIndices: async () =>
          getIndices(this.plugin.getPluginDirFullPath(), await this.plugin.getManifest()),
        getFuzzyApi: () => getFuzzySearchApi(this.app),
        signal: controller.signal,
        onTurnStarted: (turn) => {
          if (this.closed) return;
          currentTurn = turn;
          if (opts?.fullRerenderOnStart) this.rebuildTurns();
          else appendNewTurns(this.messagesEl, this.session.turns, this.app, this, this.rendered, this.turnCallbacks);
        },
        onStep: () => {
          if (this.closed || !currentTurn) return;
          this.syncTurnLive(currentTurn);
        },
        onTextDelta: () => {
          if (this.closed || !currentTurn) return;
          this.syncTurnLive(currentTurn);
        },
        onShortAnswerReady: (turn) => {
          if (this.closed) return;
          this.speech.beginStreamingSpeech(turn, turn.ttsShortAnswer ?? "", controller.signal);
        },
        onError: (message) => {
          if (this.closed) return;
          new Notice(`RAG Chat error: ${message}`);
        },
        onCancelled: (originalMessage) => {
          cancelled = true;
          if (this.closed) return;
          this.rebuildTurns();
          this.composer.inputEl.value = originalMessage;
          this.composer.inputEl.focus();
          new Notice("Anfrage abgebrochen.");
        },
        onTurnDone: (turn) => {
          if (this.closed || !this.plugin.settings.ttsEnabled) return;
          void this.speech.synthesizeAndPlay(turn, controller.signal);
        },
      });
    } finally {
      if (this.abortController === controller) this.abortController = null;
      if (!this.closed) {
        if (!cancelled && currentTurn) this.syncTurn(currentTurn);
        this.updateClarificationAffordance();
        this.setBusy(false);
        this.composer.inputEl.placeholder = inputPlaceholder(this.session);
      }
    }
  }

  private async handleSend(): Promise<void> {
    if (this.busy) return;
    const message = this.composer.inputEl.value.trim();
    if (!message) return;
    this.composer.inputEl.value = "";
    await this.runChatAction((deps) => sendMessage(this.session, message, deps));
  }

  private async handleRetryClick(turn: ChatTurn): Promise<void> {
    await this.runChatAction((deps) => retryTurn(this.session, turn, deps), { fullRerenderOnStart: true });
  }

  private handleDeleteClick(turn: ChatTurn): void {
    if (this.busy) return;
    const message = discardFailedTurn(this.session, turn);
    if (message === null) return;
    this.rebuildTurns();
    this.composer.inputEl.value = message;
    this.composer.inputEl.focus();
    this.updateClarificationAffordance();
    this.composer.inputEl.placeholder = inputPlaceholder(this.session);
  }
}
