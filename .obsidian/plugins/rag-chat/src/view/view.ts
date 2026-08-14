import { ItemView, Notice, setIcon, type WorkspaceLeaf } from "obsidian";
import type RagChatPlugin from "../main";
import { getIndices } from "../retrieval/index-cache";
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
import { confirmModal } from "./confirm-modal";
import { getFuzzySearchApi } from "./fuzzy-search-plugin";
import { appendNewTurns, renderTurns, unloadAllTurns, updateTurn, type RenderTurnsResult } from "./render-turns";
import type { TurnActionCallbacks } from "./render-turn-actions";
import type { ChatTurn } from "../retrieval/types";
import { listFlashModels } from "../gemini/models";
import { buildShortAnswer } from "../tts/short-answer";
import { synthesizeSpeech } from "../tts/client";
import { recordCharsUsed } from "../tts/usage";
import { listOutputDevices } from "../tts/devices";
import * as ttsPlayback from "../tts/playback";
import { TTS_FREE_TIER_CHAR_LIMIT } from "../constants";

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
  private modelSelectEl!: HTMLSelectElement;
  private modelRefreshButton!: HTMLButtonElement;
  private busy = false;
  private rendered: RenderTurnsResult = emptyRenderResult();
  private closed = false;
  private abortController: AbortController | null = null;
  private ttsCheckboxEl!: HTMLInputElement;
  private ttsControlsRow!: HTMLElement;
  private ttsDeviceSelectEl!: HTMLSelectElement;
  private ttsDeviceRefreshButton!: HTMLButtonElement;
  private ttsVolumeSliderEl!: HTMLInputElement;
  private ttsVolumeLabelEl!: HTMLElement;
  private ttsCharCounterEl!: HTMLElement;
  /** The turn whose TTS audio is currently playing, if any (see tts/playback.ts). */
  private ttsPlayingTurn: ChatTurn | null = null;
  private readonly turnCallbacks: TurnActionCallbacks = {
    onRetry: (turn) => void this.handleRetryClick(turn),
    onDelete: (turn) => this.handleDeleteClick(turn),
    onSpeak: (turn) => void this.handleSpeakClick(turn),
    isSpeaking: (turn) => this.ttsPlayingTurn === turn,
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

    const toolbarRow = container.createDiv({ cls: "rag-chat-toolbar-row" });

    const modelControls = toolbarRow.createDiv({ cls: "rag-chat-model-controls" });
    this.modelSelectEl = modelControls.createEl("select", { cls: "rag-chat-model-select" });
    this.registerDomEvent(this.modelSelectEl, "change", () => {
      void this.handleModelChange();
    });
    this.modelRefreshButton = modelControls.createEl("button", {
      cls: "rag-chat-model-refresh",
      attr: { "aria-label": "Modellliste aktualisieren" },
    });
    setIcon(this.modelRefreshButton, "refresh-cw");
    this.registerDomEvent(this.modelRefreshButton, "click", () => {
      void this.refreshModelOptions();
    });

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

    const ttsToggleLabel = inputRow.createEl("label", { cls: "rag-chat-tts-toggle" });
    this.ttsCheckboxEl = ttsToggleLabel.createEl("input", {
      cls: "rag-chat-tts-checkbox",
      attr: { type: "checkbox" },
    });
    this.ttsCheckboxEl.checked = this.plugin.settings.ttsEnabled;
    ttsToggleLabel.createSpan({ text: "Sprachausgabe" });
    this.registerDomEvent(this.ttsCheckboxEl, "change", () => {
      this.plugin.settings.ttsEnabled = this.ttsCheckboxEl.checked;
      void this.plugin.saveSettings();
      this.updateTtsControlsVisibility();
    });

    this.ttsControlsRow = container.createDiv({ cls: "rag-chat-tts-controls" });

    const deviceGroup = this.ttsControlsRow.createDiv({ cls: "rag-chat-tts-device" });
    this.ttsDeviceSelectEl = deviceGroup.createEl("select");
    this.registerDomEvent(this.ttsDeviceSelectEl, "change", () => {
      void this.handleTtsDeviceChange();
    });
    this.ttsDeviceRefreshButton = deviceGroup.createEl("button", {
      attr: { "aria-label": "Audioausgabegeräte aktualisieren" },
    });
    setIcon(this.ttsDeviceRefreshButton, "refresh-cw");
    this.registerDomEvent(this.ttsDeviceRefreshButton, "click", () => {
      void this.refreshTtsDeviceOptions();
    });

    const volumeGroup = this.ttsControlsRow.createDiv({ cls: "rag-chat-tts-volume" });
    this.ttsVolumeSliderEl = volumeGroup.createEl("input", {
      attr: { type: "range", min: "0", max: "1", step: "0.05" },
    });
    this.ttsVolumeSliderEl.value = String(this.plugin.settings.ttsVolume);
    this.ttsVolumeLabelEl = volumeGroup.createSpan({ cls: "rag-chat-tts-volume-label" });
    this.updateTtsVolumeLabel();
    this.registerDomEvent(this.ttsVolumeSliderEl, "input", () => {
      ttsPlayback.setVolume(Number(this.ttsVolumeSliderEl.value));
      this.updateTtsVolumeLabel();
    });
    this.registerDomEvent(this.ttsVolumeSliderEl, "change", () => {
      void this.handleTtsVolumeCommit();
    });

    this.ttsCharCounterEl = this.ttsControlsRow.createDiv({ cls: "rag-chat-tts-char-counter" });
    this.updateTtsCharCounter();

    this.updateTtsControlsVisibility();
    void this.refreshTtsDeviceOptions();

    this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this, this.turnCallbacks);
    this.updateClarificationAffordance();
    void this.refreshModelOptions();
  }

  async onClose(): Promise<void> {
    this.closed = true;
    this.abortController?.abort();
    ttsPlayback.stop();
    this.ttsPlayingTurn = null;
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
    this.modelSelectEl.disabled = busy;
    this.modelRefreshButton.disabled = busy;
  }

  private async refreshModelOptions(): Promise<void> {
    const currentModel = this.plugin.settings.generationModel;
    this.modelSelectEl.disabled = true;
    this.modelRefreshButton.disabled = true;

    const models = await listFlashModels(this.plugin.settings.geminiApiKey);
    if (this.closed) return;

    const options = models.some((model) => model.id === currentModel)
      ? models
      : [{ id: currentModel, displayName: currentModel }, ...models];

    this.modelSelectEl.empty();
    for (const model of options) {
      this.modelSelectEl.createEl("option", { attr: { value: model.id }, text: model.displayName });
    }
    this.modelSelectEl.value = currentModel;
    this.modelSelectEl.disabled = this.busy;
    this.modelRefreshButton.disabled = this.busy;
  }

  private async handleModelChange(): Promise<void> {
    const value = this.modelSelectEl.value;
    if (!value || value === this.plugin.settings.generationModel) return;
    this.plugin.settings.generationModel = value;
    await this.plugin.saveSettings();
  }

  private updateTtsControlsVisibility(): void {
    this.ttsControlsRow.toggleClass("rag-chat-hidden", !this.plugin.settings.ttsEnabled);
  }

  private updateTtsVolumeLabel(): void {
    const pct = Math.round(Number(this.ttsVolumeSliderEl.value) * 100);
    this.ttsVolumeLabelEl.setText(`${pct}%`);
  }

  private async handleTtsVolumeCommit(): Promise<void> {
    this.plugin.settings.ttsVolume = Number(this.ttsVolumeSliderEl.value);
    await this.plugin.saveSettings();
  }

  private updateTtsCharCounter(): void {
    const used = this.plugin.settings.ttsCharCount.toLocaleString("de-DE");
    const limit = TTS_FREE_TIER_CHAR_LIMIT.toLocaleString("de-DE");
    this.ttsCharCounterEl.setText(`${used} / ${limit} Zeichen (Freikontingent)`);
  }

  private async refreshTtsDeviceOptions(): Promise<void> {
    this.ttsDeviceSelectEl.disabled = true;
    this.ttsDeviceRefreshButton.disabled = true;

    const devices = await listOutputDevices();
    if (this.closed) return;

    this.ttsDeviceSelectEl.empty();
    this.ttsDeviceSelectEl.createEl("option", { attr: { value: "" }, text: "Systemstandard" });
    const deviceIds: string[] = [];
    for (const device of devices) {
      if (!device.deviceId || device.deviceId === "default") continue;
      deviceIds.push(device.deviceId);
      this.ttsDeviceSelectEl.createEl("option", {
        attr: { value: device.deviceId },
        text: device.label || `Gerät ${device.deviceId.slice(0, 8)}`,
      });
    }

    const current = this.plugin.settings.ttsOutputDeviceId;
    const hasCurrent = current === "" || deviceIds.includes(current);
    this.ttsDeviceSelectEl.value = hasCurrent ? current : "";
    this.ttsDeviceSelectEl.disabled = this.busy;
    this.ttsDeviceRefreshButton.disabled = this.busy;
  }

  private async handleTtsDeviceChange(): Promise<void> {
    this.plugin.settings.ttsOutputDeviceId = this.ttsDeviceSelectEl.value;
    await this.plugin.saveSettings();
  }

  /** Plays already-synthesized audio for `turn`, tracking it as the
   * "currently speaking" turn so the speaker button reflects a stop state,
   * and clearing that state (re-rendering the turn) once playback ends. */
  private async playTurnAudio(turn: ChatTurn, audioBase64: string): Promise<void> {
    ttsPlayback.setOnEnded(() => {
      if (this.ttsPlayingTurn !== turn) return;
      this.ttsPlayingTurn = null;
      if (!this.closed) this.syncTurn(turn);
    });
    this.ttsPlayingTurn = turn;
    try {
      await ttsPlayback.play(audioBase64, {
        deviceId: this.plugin.settings.ttsOutputDeviceId,
        volume: this.plugin.settings.ttsVolume,
      });
    } catch (err) {
      this.ttsPlayingTurn = null;
      if (!this.closed) {
        new Notice(`RAG Chat: Wiedergabe fehlgeschlagen (${err instanceof Error ? err.message : String(err)}).`);
      }
    }
    if (!this.closed) this.syncTurn(turn);
  }

  /**
   * Runs the short-answer -> synthesize -> cache -> play pipeline for a
   * turn that doesn't have cached TTS audio yet, then plays it. Any failure
   * is caught and surfaces a Notice only - the already-displayed long
   * answer is never touched. Char-usage is recorded exactly once here, per
   * real synthesis call (never for cached replays - see handleSpeakClick).
   */
  private async synthesizeAndPlay(turn: ChatTurn, signal?: AbortSignal): Promise<void> {
    turn.ttsStatus = "generating";
    this.syncTurn(turn);
    try {
      const shortText = await buildShortAnswer(turn.text, this.plugin.settings, { signal });
      const audio = await synthesizeSpeech(shortText, this.plugin.settings, { signal });
      await recordCharsUsed(this.plugin, shortText.length);
      if (this.closed) return;
      turn.ttsText = shortText;
      turn.ttsAudioBase64 = audio;
      turn.ttsStatus = "ready";
      this.updateTtsCharCounter();
      void this.playTurnAudio(turn, audio);
    } catch (err) {
      turn.ttsStatus = "error";
      if (!this.closed) {
        this.syncTurn(turn);
        new Notice(`RAG Chat: Sprachausgabe fehlgeschlagen (${err instanceof Error ? err.message : String(err)}).`);
      }
    }
  }

  private async handleSpeakClick(turn: ChatTurn): Promise<void> {
    if (this.ttsPlayingTurn === turn) {
      ttsPlayback.stop();
      this.ttsPlayingTurn = null;
      this.syncTurn(turn);
      return;
    }
    if (turn.ttsStatus === "generating") return;
    if (turn.ttsAudioBase64) {
      void this.playTurnAudio(turn, turn.ttsAudioBase64);
      return;
    }
    await this.synthesizeAndPlay(turn);
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
    if (!updateTurn(this.messagesEl, turn, this.app, this, this.rendered, this.turnCallbacks)) {
      appendNewTurns(this.messagesEl, this.session.turns, this.app, this, this.rendered, this.turnCallbacks);
    }
  }

  private rebuildTurns(): void {
    unloadAllTurns(this.rendered);
    this.rendered = renderTurns(this.messagesEl, this.session.turns, this.app, this, this.turnCallbacks);
  }

  private async runChatAction(
    action: (deps: SendMessageDeps) => Promise<void>,
    opts?: { fullRerenderOnStart?: boolean }
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
        getIndices: async () => getIndices(this.plugin.getPluginDirFullPath(), await this.plugin.getManifest()),
        getFuzzyApi: () => getFuzzySearchApi(this.app),
        signal: controller.signal,
        onTurnStarted: (turn) => {
          if (this.closed) return;
          currentTurn = turn;
          if (opts?.fullRerenderOnStart) {
            this.rebuildTurns();
          } else {
            appendNewTurns(this.messagesEl, this.session.turns, this.app, this, this.rendered, this.turnCallbacks);
          }
        },
        onStep: () => {
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
          this.rebuildTurns();
          this.inputEl.value = originalMessage;
          this.inputEl.focus();
          new Notice("Anfrage abgebrochen.");
        },
        onTurnDone: (turn) => {
          if (this.closed || !this.plugin.settings.ttsEnabled) return;
          void this.synthesizeAndPlay(turn, controller.signal);
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

  private async handleSend(): Promise<void> {
    if (this.busy) return;
    const message = this.inputEl.value.trim();
    if (!message) return;
    this.inputEl.value = "";
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
    this.inputEl.value = message;
    this.inputEl.focus();
    this.updateClarificationAffordance();
    this.inputEl.placeholder = inputPlaceholder(this.session);
  }
}
