import { Notice, Plugin, type WorkspaceLeaf } from "obsidian";
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

const PUSH_TO_TALK_KEY = "F12";

export default class RagChatPlugin extends Plugin {
  settings!: RagChatSettings;
  private readonly store = new SettingsStore(this);
  private manifestCache: RagManifest | null = null;
  private pushToTalkActive = false;

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
