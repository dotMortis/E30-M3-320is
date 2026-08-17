import { ItemView, Notice, type WorkspaceLeaf } from "obsidian";
import type RagChatPlugin from "../main";
import { getIndices } from "../retrieval/index-cache";
import type { ChatTurn } from "../retrieval/types";
import type { RemoteBridgeStatus } from "../remote/bridge-client";
import { MicRecorder } from "../stt/recorder";
import { blobToWavBase64 } from "../stt/wav-encode";
import { confirmModal } from "./confirm-modal";
import {
  abandonPendingClarification,
  createChatSessionState,
  discardFailedTurn,
  inputPlaceholder,
  retryTurn,
  sendMessage,
  sendVoiceMessage,
  type ChatSessionState,
  type SendMessageDeps,
  type SendMessageOptions,
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

/** Recordings shorter than this are treated as accidental taps and silently discarded. */
const MIN_RECORDING_MS = 300;

/**
 * What started the current recording. The global mouseup/blur fallbacks must
 * only cancel "mouse" recordings - see wireMic().
 */
type RecordingOrigin = "mouse" | "hotkey" | "remote";

function errText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

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
  private lockOverlayEl!: HTMLElement;
  private toolbar!: ToolbarElements;
  private composer!: ComposerElements;
  private ttsControls!: TtsControlsElements;
  private ttsController!: TtsControlsController;
  private busy = false;
  private rendered: RenderTurnsResult = emptyRenderResult();
  private closed = false;
  private abortController: AbortController | null = null;
  private recording = false;
  private recordingOrigin: RecordingOrigin | null = null;
  private recorder: MicRecorder | null = null;
  private recordingStartedAt = 0;
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

    this.lockOverlayEl = this.buildLockOverlay(container);

    this.wireToolbar();
    this.wireComposer();
    this.wireMic();
    this.wireTtsControls();
    this.setRemoteStatus(this.plugin.getRemoteStatus());
    this.setLocked(this.plugin.isLocked());

    this.composer.thinkingCheckboxEl.checked =
      this.plugin.settings.thinkingEnabled;
    this.composer.webSearchCheckboxEl.checked =
      this.plugin.settings.webSearchEnabled;
    this.composer.ttsCheckboxEl.checked = this.plugin.settings.ttsEnabled;
    this.ttsController.syncFromSettings();
    void this.ttsController.refreshDevices();

    this.rendered = renderTurns(
      this.messagesEl,
      this.session.turns,
      this.app,
      this,
      this.turnCallbacks,
    );
    this.updateClarificationAffordance();
    void this.refreshModelOptions();
  }

  /**
   * Blurred "locked" curtain over the whole chat. Shown while stored API keys
   * are still encrypted: clicking it re-opens the password prompt, so a
   * dismissed startup prompt is always recoverable from the UI itself.
   */
  private buildLockOverlay(container: HTMLElement): HTMLElement {
    const overlay = container.createDiv({ cls: "rag-chat-lock-overlay rag-chat-hidden" });
    const button = overlay.createEl("button", {
      cls: "rag-chat-lock-overlay-button",
      text: "🔒 Entsperren",
    });
    button.setAttribute("aria-label", "Gespeicherte API-Schlüssel entsperren");
    this.registerDomEvent(overlay, "click", () => void this.handleUnlockClick());
    return overlay;
  }

  /** Shows/hides the locked curtain. Called by the plugin on state changes. */
  setLocked(locked: boolean): void {
    this.lockOverlayEl?.toggleClass("rag-chat-hidden", !locked);
    this.contentEl.toggleClass("is-locked", locked);
  }

  private async handleUnlockClick(): Promise<void> {
    await this.plugin.promptUnlock();
    if (this.closed) return;
    this.setLocked(this.plugin.isLocked());
    // Model list needs the API key, which only just became available.
    if (!this.plugin.isLocked()) void this.refreshModelOptions();
  }

  private wireToolbar(): void {
    this.registerDomEvent(
      this.toolbar.modelSelectEl,
      "change",
      () => void this.handleModelChange(),
    );
    this.registerDomEvent(
      this.toolbar.modelRefreshButton,
      "click",
      () => void this.refreshModelOptions(),
    );
    this.registerDomEvent(
      this.toolbar.clearButton,
      "click",
      () => void this.handleClearClick(),
    );
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

  private wireMic(): void {
    const c = this.composer;
    const start = (evt: Event) => {
      evt.preventDefault();
      this.startVoiceRecording("mouse");
    };
    const stop = () => {
      if (this.recording) void this.stopVoiceRecordingAndSend();
    };
    // Only cancel *mouse-initiated* recordings: this fallback also fires for
    // unrelated clicks and whenever the Obsidian window loses focus, which
    // would otherwise cut a hands-free hardware-remote recording short
    // (hardware/voice-remote/PLAN.md) - the remote has its own RELEASE signal
    // plus a safety timeout for that.
    const stopIfMouseInitiated = () => {
      if (this.recordingOrigin === "mouse") stop();
    };
    this.registerDomEvent(c.micButton, "mousedown", start);
    this.registerDomEvent(c.micButton, "mouseup", stopIfMouseInitiated);
    this.registerDomEvent(c.micButton, "mouseleave", stopIfMouseInitiated);
    // Fallback in case the mouse is released (or the window loses focus) outside the button.
    if (typeof window !== "undefined") {
      this.registerDomEvent(window, "mouseup", stopIfMouseInitiated);
      this.registerDomEvent(window, "blur", stopIfMouseInitiated);
    }
  }

  /**
   * Starts a push-to-talk recording. Returns whether recording actually
   * started, so callers that arm their own timeout (the hardware remote's
   * safety timer) don't guard a recording that never began.
   */
  startVoiceRecording(origin: RecordingOrigin = "mouse"): boolean {
    if (this.closed || this.recording) return false;
    // The overlay blocks the mic button, but the global hotkey and the hardware
    // remote don't go through the DOM - without this they'd record a whole
    // message only to fail on the missing API key.
    if (this.plugin.isLocked()) {
      new Notice("RAG Chat: API-Schlüssel gesperrt - bitte zuerst entsperren.");
      void this.handleUnlockClick();
      return false;
    }
    if (this.busy) {
      new Notice("RAG Chat: Aufnahme nicht möglich - es läuft noch eine Antwort.");
      return false;
    }
    this.recording = true;
    this.recordingOrigin = origin;
    this.recordingStartedAt = Date.now();
    this.composer.micButton.addClass("is-recording");

    const recorder = new MicRecorder();
    this.recorder = recorder;
    recorder
      .start(this.plugin.settings.micInputDeviceId || undefined)
      .catch((err) => {
        if (this.recorder !== recorder) return;
        this.recording = false;
        this.recordingOrigin = null;
        this.recorder = null;
        this.notifyRecordingEnded();
        if (!this.closed) {
          this.composer.micButton.removeClass("is-recording");
          new Notice(
            `RAG Chat: Mikrofonzugriff fehlgeschlagen (${errText(err)}).`,
          );
        }
      });
    return true;
  }

  async stopVoiceRecordingAndSend(): Promise<void> {
    if (!this.recording || !this.recorder) return;
    this.recording = false;
    this.recordingOrigin = null;
    this.notifyRecordingEnded();
    this.composer.micButton.removeClass("is-recording");
    const recorder = this.recorder;
    this.recorder = null;
    const startedAt = this.recordingStartedAt;

    let blob: Blob | null;
    try {
      blob = await recorder.stop();
    } catch (err) {
      if (!this.closed)
        new Notice(`RAG Chat: Aufnahme fehlgeschlagen (${errText(err)}).`);
      return;
    }
    if (this.closed) return;
    if (!blob || Date.now() - startedAt < MIN_RECORDING_MS) return;

    if (this.busy) {
      new Notice("RAG Chat: Aufnahme verworfen - es läuft noch eine Antwort.");
      return;
    }
    try {
      const { base64, mimeType } = await blobToWavBase64(blob);
      if (this.closed) return;
      await this.runChatAction((deps) =>
        sendVoiceMessage(this.session, { base64Audio: base64, mimeType }, deps),
      );
    } catch (err) {
      if (!this.closed)
        new Notice(
          `RAG Chat: Sprachaufnahme fehlgeschlagen (${errText(err)}).`,
        );
    }
  }

  /**
   * Reflects the hardware voice-remote bridge's link status (or its absence,
   * when the feature is disabled/unsupported) on the small dot badge over
   * the mic button. See hardware/voice-remote/PLAN.md.
   */
  setRemoteStatus(status: RemoteBridgeStatus | null): void {
    const dot = this.composer.remoteStatusDot;
    const visible = status !== null && status !== "unsupported";
    dot.toggleClass("is-visible", visible);
    dot.toggleClass("is-connected", status === "connected");
    dot.toggleClass("is-error", status === "error");
    dot.toggleClass("is-disconnected", visible && status !== "connected" && status !== "error");
    const labels: Record<RemoteBridgeStatus, string> = {
      connected: "Hardware-Fernbedienung: verbunden",
      starting: "Hardware-Fernbedienung: Verbindungsaufbau...",
      disconnected: "Hardware-Fernbedienung: getrennt",
      error: "Hardware-Fernbedienung: Fehler",
      unsupported: "Hardware-Fernbedienung: nicht unterstützt",
    };
    dot.setAttribute("aria-label", status ? labels[status] : "");
    dot.setAttribute("title", status ? labels[status] : "");
  }

  /**
   * Tell the plugin a recording is over, whichever way it ended, so the
   * hardware remote's safety timer can never outlive it (and fire a
   * misleading "automatically stopped" notice for an already-sent recording).
   */
  private notifyRecordingEnded(): void {
    this.plugin.notifyRecordingEnded?.();
  }

  /** Brief visual confirmation that a real press/release arrived from the remote. */
  pulseRemoteIndicator(): void {
    const dot = this.composer.remoteStatusDot;
    dot.removeClass("is-pulse");
    // Force a reflow so re-adding the class restarts the CSS animation even
    // for back-to-back presses.
    void (dot as unknown as { offsetWidth?: number }).offsetWidth;
    dot.addClass("is-pulse");
  }

  private wireTtsControls(): void {
    const t = this.ttsControls;
    this.registerDomEvent(
      t.deviceSelectEl,
      "change",
      () => void this.ttsController.commitDevice(),
    );
    this.registerDomEvent(
      t.deviceRefreshButton,
      "click",
      () => void this.ttsController.refreshDevices(),
    );
    this.registerDomEvent(t.volumeSliderEl, "input", () =>
      this.ttsController.onVolumeInput(),
    );
    this.registerDomEvent(
      t.volumeSliderEl,
      "change",
      () => void this.ttsController.commitVolume(),
    );
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
    this.rendered = renderTurns(
      this.messagesEl,
      this.session.turns,
      this.app,
      this,
      this.turnCallbacks,
    );
    this.updateClarificationAffordance();
    this.composer.inputEl.placeholder = inputPlaceholder(this.session);
  }

  private async handleClearClick(): Promise<void> {
    const confirmed = await confirmModal(
      this.app,
      "Chat leeren? Der bisherige Verlauf geht verloren.",
    );
    if (this.closed) return;
    if (confirmed) this.clearChat();
    this.composer.inputEl.focus();
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.composer.sendButton.setText(busy ? "Abbrechen" : "Fragen");
    this.composer.micButton.disabled = busy;
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
    const confirmed = await confirmModal(
      this.app,
      "Anfrage wirklich abbrechen?",
    );
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
    if (
      !updateTurn(
        this.messagesEl,
        turn,
        this.app,
        this,
        this.rendered,
        this.turnCallbacks,
      )
    ) {
      appendNewTurns(
        this.messagesEl,
        this.session.turns,
        this.app,
        this,
        this.rendered,
        this.turnCallbacks,
      );
    }
  }

  private syncTurnLive(turn: ChatTurn): void {
    if (!updateTurnLive(turn, this.rendered, this.messagesEl)) {
      this.syncTurn(turn);
    }
  }

  private rebuildTurns(): void {
    unloadAllTurns(this.rendered);
    this.rendered = renderTurns(
      this.messagesEl,
      this.session.turns,
      this.app,
      this,
      this.turnCallbacks,
    );
  }

  private async runChatAction(
    action: (deps: SendMessageDeps) => Promise<void>,
    opts?: { fullRerenderOnStart?: boolean },
  ): Promise<void> {
    if (this.busy) return;
    if (this.plugin.isLocked()) {
      new Notice("RAG Chat: API-Schlüssel gesperrt - bitte zuerst entsperren.");
      void this.handleUnlockClick();
      return;
    }
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
          getIndices(
            this.plugin.getPluginDirFullPath(),
            await this.plugin.getManifest(),
          ),
        getFuzzyApi: () => getFuzzySearchApi(this.app),
        signal: controller.signal,
        onTurnStarted: (turn) => {
          if (this.closed) return;
          currentTurn = turn;
          if (opts?.fullRerenderOnStart) this.rebuildTurns();
          else
            appendNewTurns(
              this.messagesEl,
              this.session.turns,
              this.app,
              this,
              this.rendered,
              this.turnCallbacks,
            );
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
          this.speech.beginStreamingSpeech(
            turn,
            turn.ttsShortAnswer ?? "",
            controller.signal,
          );
        },
        onTranscriptReady: (turn) => {
          if (this.closed) return;
          this.syncTurn(turn);
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
          if (this.closed) return;
          if (!turn.originatedFromVoice && !this.plugin.settings.ttsEnabled)
            return;
          void this.speech.synthesizeAndPlay(turn, controller.signal);
        },
        onClarificationReady: (turn) => {
          if (this.closed) return;
          if (!turn.originatedFromVoice && !this.plugin.settings.ttsEnabled) return;
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

  private async handleSend(
    overrideMessage?: string,
    opts?: SendMessageOptions,
  ): Promise<void> {
    if (this.busy) return;
    const message = (overrideMessage ?? this.composer.inputEl.value).trim();
    if (!message) return;
    this.composer.inputEl.value = "";
    await this.runChatAction((deps) =>
      sendMessage(this.session, message, deps, opts),
    );
  }

  private async handleRetryClick(turn: ChatTurn): Promise<void> {
    await this.runChatAction((deps) => retryTurn(this.session, turn, deps), {
      fullRerenderOnStart: true,
    });
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
