import { Notice, Platform, Plugin, type WorkspaceLeaf } from "obsidian";
import type { RagChatSettings } from "./settings/types";
import { SECRET_LABELS, SettingsStore, type SecretKey } from "./settings/settings-store";
import { RagChatSettingTab } from "./settings/settings-tab";
import { passwordModal } from "./view/password-modal";
import { RAG_CHAT_VIEW_TYPE, RagChatView } from "./view/view";
import { validateManifest } from "./retrieval/embeddings";
import { clearIndicesCache } from "./retrieval/index-cache";
import type { RagManifest } from "./retrieval/types";
import { getPluginDir, getPluginDirFullPath } from "./plugin/paths";
import { readManifest } from "./retrieval/manifest";
import { dispose as disposeTtsPlayback } from "./tts/playback";
import { RemoteBridgeClient, type RemoteBridgeStatus } from "./remote/bridge-client";

const PUSH_TO_TALK_KEY = "F12";

/**
 * Safety net for the hardware voice remote (hardware/voice-remote/PLAN.md):
 * if a RELEASE signal is ever lost over the air, auto-stop the recording
 * after this long rather than recording forever.
 */
const REMOTE_SAFETY_TIMEOUT_MS = 30_000;

/**
 * Device-level warnings from the receiver (`ERR ...` lines, e.g.
 * "stale-epoch-repair-needed" when the remote's NVS was wiped and the pair
 * needs re-pairing). Always logged, but only surfaced as a Notice this often,
 * so a repeating condition cannot bury the user in toasts.
 */
const REMOTE_WARNING_NOTICE_INTERVAL_MS = 60_000;

export default class RagChatPlugin extends Plugin {
  settings!: RagChatSettings;
  readonly store = new SettingsStore(this);
  /** Guards against stacking unlock modals (startup + overlay click + command). */
  private unlockPromptOpen = false;
  private manifestCache: RagManifest | null = null;
  private pushToTalkActive = false;
  private remoteBridge: RemoteBridgeClient | null = null;
  private remoteSafetyTimer: ReturnType<typeof setTimeout> | null = null;
  /** Monotonic id of the most recent remote PRESS (see handleRemotePress). */
  private remotePressSeq = 0;
  /** Highest PRESS id that has already been released (see handleRemoteRelease). */
  private remoteReleasedSeq = 0;
  private remoteStatusListeners = new Set<() => void>();
  private lastRemoteWarningNoticeAt = 0;

  async onload(): Promise<void> {
    // Wire the password UI before loading, so a save triggered during startup
    // can never hit the "no password prompt available" path.
    this.store.setPasswordPrompt((request) => passwordModal(this.app, request));
    await this.loadSettings();
    this.store.onLockStateChange(() => this.broadcastLockState());

    this.registerView(RAG_CHAT_VIEW_TYPE, (leaf: WorkspaceLeaf) => new RagChatView(leaf, this));

    this.addRibbonIcon("message-circle-question", "RAG Chat öffnen", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "rag-chat-open",
      name: "RAG: Frage stellen",
      callback: () => {
        void this.activateView();
      },
    });

    this.addCommand({
      id: "rag-chat-reload-index",
      name: "RAG: Index neu laden",
      callback: () => {
        void this.reloadIndex();
      },
    });

    this.addCommand({
      id: "rag-chat-clear",
      name: "RAG: Chat leeren",
      callback: () => {
        for (const leaf of this.app.workspace.getLeavesOfType(RAG_CHAT_VIEW_TYPE)) {
          if (leaf.view instanceof RagChatView) leaf.view.clearChat();
        }
      },
    });

    this.addCommand({
      id: "rag-chat-unlock-secrets",
      name: "RAG: Secrets entsperren",
      callback: () => {
        void this.promptUnlock();
      },
    });

    this.addCommand({
      id: "rag-chat-lock-secrets",
      name: "RAG: Secrets sperren",
      callback: () => {
        if (!this.store.hasProtectedSecrets()) {
          new Notice("RAG Chat: Keine gespeicherten Secrets vorhanden.");
          return;
        }
        this.store.lock();
        new Notice("RAG Chat: Secrets gesperrt.");
      },
    });

    this.addSettingTab(new RagChatSettingTab(this.app, this));

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handlePushToTalkKeyDown);
      window.addEventListener("keyup", this.handlePushToTalkKeyUp);
    }

    this.app.workspace.onLayoutReady(() => {
      void this.activateView({ focus: false });
      // Non-blocking: the view loads either way and shows its locked overlay
      // until this is answered (or the overlay/command is used later).
      void this.promptUnlock();
    });

    this.refreshRemoteBridge();

    try {
      await this.revalidateManifest();
    } catch (err) {
      new Notice(
        `RAG Chat: konnte rag-manifest.json nicht laden (${err instanceof Error ? err.message : String(err)}). Index ggf. neu bauen.`,
        10000
      );
    }
  }

  onunload(): void {
    disposeTtsPlayback();
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handlePushToTalkKeyDown);
      window.removeEventListener("keyup", this.handlePushToTalkKeyUp);
    }
    this.clearRemoteSafetyTimer();
    this.remoteBridge?.stop();
    this.remoteBridge = null;
  }

  /**
   * Global push-to-talk hotkey (Ctrl+Alt+Shift+F12): mirrors the mic button in the chat view -
   * hold to record, release to transcribe and send. Works while the RAG Chat view is open,
   * even if it isn't the focused pane.
   */
  private readonly handlePushToTalkKeyDown = (evt: KeyboardEvent): void => {
    if (!(evt.ctrlKey && evt.altKey && evt.shiftKey && evt.key === PUSH_TO_TALK_KEY)) return;
    evt.preventDefault();
    if (this.pushToTalkActive) return;
    const view = this.getFirstChatView();
    if (!view) {
      new Notice("RAG Chat: Bitte zuerst die Chat-Ansicht öffnen.");
      return;
    }
    this.pushToTalkActive = true;
    view.startVoiceRecording("hotkey");
  };

  private readonly handlePushToTalkKeyUp = (evt: KeyboardEvent): void => {
    if (evt.key !== PUSH_TO_TALK_KEY || !this.pushToTalkActive) return;
    evt.preventDefault();
    this.pushToTalkActive = false;
    void this.getFirstChatView()?.stopVoiceRecordingAndSend();
  };

  /** True when stored secrets exist but aren't decrypted in this session yet. */
  isLocked(): boolean {
    return this.store.isLocked();
  }

  /**
   * Asks for the password and unlocks whatever it can. Safe to call when
   * nothing is locked (no-op) and re-entrant-safe, so the startup prompt, the
   * chat overlay and the command can't stack modals on top of each other.
   */
  async promptUnlock(): Promise<boolean> {
    if (!this.store.isLocked()) return true;
    if (this.unlockPromptOpen) return false;
    this.unlockPromptOpen = true;
    try {
      let error: string | undefined;
      for (;;) {
        const password = await passwordModal(this.app, { mode: "unlock", error });
        if (password === null) return false;
        const { unlocked, failed } = await this.store.unlock(password);
        if (unlocked.length === 0) {
          error = "Falsches Passwort.";
          continue;
        }
        // Some secrets may have been encrypted under a different password
        // (e.g. copied in from another vault); report them individually
        // instead of silently leaving them empty.
        if (failed.length) this.noticeUnlockFailures(failed);
        return true;
      }
    } finally {
      this.unlockPromptOpen = false;
    }
  }

  private noticeUnlockFailures(failed: SecretKey[]): void {
    for (const key of failed) {
      new Notice(
        `RAG Chat: ${SECRET_LABELS[key]} konnte mit diesem Passwort nicht entsperrt werden - bitte in den Einstellungen erneut eingeben.`,
        10000,
      );
    }
  }

  private broadcastLockState(): void {
    const locked = this.store.isLocked();
    for (const leaf of this.app.workspace.getLeavesOfType(RAG_CHAT_VIEW_TYPE)) {
      if (leaf.view instanceof RagChatView) leaf.view.setLocked(locked);
    }
  }

  private getFirstChatView(): RagChatView | null {
    for (const leaf of this.app.workspace.getLeavesOfType(RAG_CHAT_VIEW_TYPE)) {
      if (leaf.view instanceof RagChatView) return leaf.view;
    }
    return null;
  }

  /**
   * (Re)starts the hardware voice-remote bridge (hardware/voice-remote/PLAN.md)
   * to match current settings. Safe to call any time settings change (e.g.
   * from the settings tab's toggle/port-override handlers) - always tears
   * down any existing client first. No-op on mobile, where Node child
   * processes aren't available.
   */
  refreshRemoteBridge(): void {
    this.remoteBridge?.stop();
    this.remoteBridge = null;
    this.broadcastRemoteStatus(null);

    if (!Platform.isDesktopApp) return;
    if (!this.settings.remoteEnabled) return;

    this.remoteBridge = new RemoteBridgeClient(
      this.getPluginDirFullPath(),
      {
        onPress: () => void this.handleRemotePress(),
        onRelease: () => this.handleRemoteRelease(),
        onStatusChange: (status, detail) => this.handleRemoteStatusChange(status, detail),
        onWarning: (message) => this.handleRemoteWarning(message),
      },
      () => this.settings.remoteSerialPortOverride,
    );
    this.remoteBridge.start();
  }

  getRemoteStatus(): RemoteBridgeStatus | null {
    return this.remoteBridge?.getStatus() ?? null;
  }

  /** Extra context for the current status (error text, port name, ...), if any. */
  getRemoteStatusDetail(): string | undefined {
    return this.remoteBridge?.getStatusDetail();
  }

  /**
   * Lets an open UI (e.g. the settings tab) follow bridge status changes
   * instead of showing whatever the status happened to be when it rendered.
   * Returns an unsubscribe function.
   */
  onRemoteStatusChange(listener: () => void): () => void {
    this.remoteStatusListeners.add(listener);
    return () => this.remoteStatusListeners.delete(listener);
  }

  /**
   * A remote PRESS. Note this is async (the chat view may still have to be
   * opened), while handleRemoteRelease is synchronous - so a RELEASE can
   * genuinely be processed *before* the PRESS that preceded it finishes.
   * Every press therefore carries a sequence number and bails out if its own
   * release already arrived, otherwise a quick tap would start a recording
   * that nothing is left to stop (it would run until the 30s safety timeout
   * and then send half a minute of audio).
   */
  private async handleRemotePress(): Promise<void> {
    const seq = ++this.remotePressSeq;
    await this.activateView();
    const view = this.getFirstChatView();
    if (!view) return;
    view.pulseRemoteIndicator();
    if (this.remoteReleasedSeq >= seq) return;
    // Only arm the safety timer if a recording really started - startVoiceRecording
    // declines while a previous answer is still generating, and a timer without a
    // recording would fire a bogus "automatically stopped" notice 30s later.
    if (!view.startVoiceRecording("remote")) return;
    this.armRemoteSafetyTimer();
  }

  private handleRemoteRelease(): void {
    this.remoteReleasedSeq = this.remotePressSeq;
    this.clearRemoteSafetyTimer();
    const view = this.getFirstChatView();
    view?.pulseRemoteIndicator();
    void view?.stopVoiceRecordingAndSend();
  }

  /**
   * Called by the view whenever a recording ends for any reason (manual stop,
   * window blur, mic failure), so the remote's safety timer can never outlive
   * the recording it was guarding and fire a misleading notice.
   */
  notifyRecordingEnded(): void {
    this.clearRemoteSafetyTimer();
  }

  private armRemoteSafetyTimer(): void {
    this.clearRemoteSafetyTimer();
    this.remoteSafetyTimer = setTimeout(() => {
      this.remoteSafetyTimer = null;
      void this.getFirstChatView()?.stopVoiceRecordingAndSend();
      new Notice(
        "RAG Chat: Fernbedienung - Aufnahme nach 30s automatisch beendet (kein Loslassen-Signal empfangen).",
        8000,
      );
    }, REMOTE_SAFETY_TIMEOUT_MS);
  }

  private clearRemoteSafetyTimer(): void {
    if (this.remoteSafetyTimer) {
      clearTimeout(this.remoteSafetyTimer);
      this.remoteSafetyTimer = null;
    }
  }

  /**
   * The bridge hands us a detail string with every status change (why the
   * platform is unsupported, which binary is missing, the actual serial open
   * error). Log it: the settings tab tells the user to look in the developer
   * console, and this is the only thing that ever puts it there.
   */
  private handleRemoteStatusChange(status: RemoteBridgeStatus, detail?: string): void {
    const suffix = detail ? ` (${detail})` : "";
    if (status === "error" || status === "unsupported") {
      console.error(`RAG Chat: Fernbedienung-Status "${status}"${suffix}`);
    } else {
      console.info(`RAG Chat: Fernbedienung-Status "${status}"${suffix}`);
    }
    this.broadcastRemoteStatus(status);
  }

  /**
   * Device-level `ERR ...` line from the receiver. Deliberately not a status
   * change: the USB link is demonstrably fine (we just received a line over
   * it), and treating device chatter as a link error would latch the UI into
   * "Fehler" indefinitely, since status is only re-emitted on
   * connect/disconnect.
   */
  private handleRemoteWarning(message: string): void {
    console.warn(`RAG Chat: Fernbedienung meldet "${message}"`);
    const now = Date.now();
    if (now - this.lastRemoteWarningNoticeAt < REMOTE_WARNING_NOTICE_INTERVAL_MS) return;
    this.lastRemoteWarningNoticeAt = now;
    new Notice(`RAG Chat: Fernbedienung-Hinweis: ${message}`, 6000);
  }

  private broadcastRemoteStatus(status: RemoteBridgeStatus | null): void {
    for (const leaf of this.app.workspace.getLeavesOfType(RAG_CHAT_VIEW_TYPE)) {
      if (leaf.view instanceof RagChatView) leaf.view.setRemoteStatus(status);
    }
    for (const listener of this.remoteStatusListeners) listener();
  }

  getPluginDir(): string {
    return getPluginDir(this.manifest);
  }

  getPluginDirFullPath(): string {
    return getPluginDirFullPath(this.app.vault, this.manifest);
  }

  async getManifest(): Promise<RagManifest> {
    if (this.manifestCache) return this.manifestCache;
    this.manifestCache = await readManifest(this.app.vault, this.getPluginDir());
    return this.manifestCache;
  }

  async reloadIndex(): Promise<void> {
    this.manifestCache = null;
    clearIndicesCache();
    try {
      await this.getManifest();
      await this.revalidateManifest();
      new Notice("RAG Chat: Index-Cache geleert, Manifest neu geladen.", 6000);
    } catch (err) {
      new Notice(
        `RAG Chat: konnte rag-manifest.json nicht laden (${err instanceof Error ? err.message : String(err)}). Index ggf. neu bauen.`,
        10000
      );
    }
  }

  async revalidateManifest(): Promise<void> {
    const manifest = await this.getManifest();
    const warnings = validateManifest(manifest, this.settings);
    for (const w of warnings) new Notice(`RAG Chat: ${w}`, 10000);
  }

  async activateView(options?: { focus?: boolean }): Promise<void> {
    const focus = options?.focus ?? true;
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(RAG_CHAT_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);

      await leaf.setViewState({ type: RAG_CHAT_VIEW_TYPE, active: focus });
    }

    workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    await this.store.load();
    this.settings = this.store.settings;
  }

  async saveSettings(): Promise<void> {
    await this.store.save();
  }
}
