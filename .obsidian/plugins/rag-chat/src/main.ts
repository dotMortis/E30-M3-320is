import { Notice, Platform, Plugin, type WorkspaceLeaf } from "obsidian";
import type { RagChatSettings } from "./settings/types";
import { SettingsStore } from "./settings/settings-store";
import { RagChatSettingTab } from "./settings/settings-tab";
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

export default class RagChatPlugin extends Plugin {
  settings!: RagChatSettings;
  private readonly store = new SettingsStore(this);
  private manifestCache: RagManifest | null = null;
  private pushToTalkActive = false;
  private remoteBridge: RemoteBridgeClient | null = null;
  private remoteSafetyTimer: ReturnType<typeof setTimeout> | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

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

    this.addSettingTab(new RagChatSettingTab(this.app, this));

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handlePushToTalkKeyDown);
      window.addEventListener("keyup", this.handlePushToTalkKeyUp);
    }

    this.app.workspace.onLayoutReady(() => {
      void this.activateView({ focus: false });
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
    view.startVoiceRecording();
  };

  private readonly handlePushToTalkKeyUp = (evt: KeyboardEvent): void => {
    if (evt.key !== PUSH_TO_TALK_KEY || !this.pushToTalkActive) return;
    evt.preventDefault();
    this.pushToTalkActive = false;
    void this.getFirstChatView()?.stopVoiceRecordingAndSend();
  };

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
        onStatusChange: (status) => this.broadcastRemoteStatus(status),
      },
      () => this.settings.remoteSerialPortOverride,
    );
    this.remoteBridge.start();
  }

  getRemoteStatus(): RemoteBridgeStatus | null {
    return this.remoteBridge?.getStatus() ?? null;
  }

  private async handleRemotePress(): Promise<void> {
    await this.activateView();
    const view = this.getFirstChatView();
    if (!view) return;
    view.startVoiceRecording();
    view.pulseRemoteIndicator();
    this.armRemoteSafetyTimer();
  }

  private handleRemoteRelease(): void {
    this.clearRemoteSafetyTimer();
    const view = this.getFirstChatView();
    view?.pulseRemoteIndicator();
    void view?.stopVoiceRecordingAndSend();
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

  private broadcastRemoteStatus(status: RemoteBridgeStatus | null): void {
    for (const leaf of this.app.workspace.getLeavesOfType(RAG_CHAT_VIEW_TYPE)) {
      if (leaf.view instanceof RagChatView) leaf.view.setRemoteStatus(status);
    }
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
