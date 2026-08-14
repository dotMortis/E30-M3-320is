import { Notice, Plugin, type WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, type RagChatSettings } from "./settings/types";
import { RagChatSettingTab } from "./settings/settings-tab";
import { RAG_CHAT_VIEW_TYPE, RagChatView } from "./view/view";
import { validateManifest } from "./retrieval/embeddings";
import { clearIndicesCache } from "./retrieval/index-cache";
import type { RagManifest } from "./retrieval/types";
import { getPluginDir, getPluginDirFullPath } from "./plugin/paths";
import { readManifest } from "./retrieval/manifest";
import { decryptSecret, encryptSecret } from "./secure-storage";
import { dispose as disposeTtsPlayback } from "./tts/playback";

export default class RagChatPlugin extends Plugin {
  settings!: RagChatSettings;
  private manifestCache: RagManifest | null = null;
  // Caches the last plaintext geminiApiKey we encrypted, and its ciphertext,
  // so saveSettings() (called on every settings-tab keystroke/toggle, not
  // just API-key changes) can skip a full encrypt round-trip (fresh
  // salt/IV) when the key itself hasn't actually changed since last save.
  private lastEncryptedApiKeyPlaintext: string | undefined;
  private lastEncryptedApiKeyCiphertext: string | undefined;
  // Same cache-pair mechanism as above, mirrored for the optional, separate
  // ttsApiKey setting.
  private lastEncryptedTtsApiKeyPlaintext: string | undefined;
  private lastEncryptedTtsApiKeyCiphertext: string | undefined;

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

    // Ensure the RAG Chat view is present in the right sidebar once the
    // workspace layout is ready, mirroring the vault's previous
    // show-local-graph plugin. This makes RAG Chat appear by default for
    // every user, independent of the per-user (gitignored) workspace.json
    // state, without stealing focus from the editor on startup.
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

  /**
   * Clears both the manifest cache and the loaded-index cache, then reloads
   * the manifest and re-validates it against current settings. Backs the
   * "RAG: Index neu laden" command, for when the underlying index files
   * changed on disk (e.g. a rebuilt corpus) independent of a plugin reload.
   */
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

  /**
   * Re-runs manifest/settings validation (embeddingModel/outputDim parity)
   * against the cached manifest and surfaces any mismatch as a Notice. Only
   * warns once at onload() otherwise, even though outputDim/embeddingModel
   * can change live via the settings tab.
   */
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
      // Only mark the leaf active (and thus focused/revealed) when the
      // caller explicitly wants focus, e.g. the ribbon icon or command.
      // The startup auto-open passes focus: false so it doesn't steal
      // keyboard focus from the editor.
      await leaf.setViewState({ type: RAG_CHAT_VIEW_TYPE, active: focus });
    }
    // Reveal the sidebar leaf regardless of focus so it's visible even when
    // auto-opened at startup; `active: false` above already ensured we
    // didn't steal keyboard focus from the editor in that case.
    workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    const raw = ((await this.loadData()) ?? {}) as Record<string, unknown>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw) as RagChatSettings;

    const storedApiKey = raw.geminiApiKey as string | undefined;
    try {
      this.settings.geminiApiKey = await decryptSecret(storedApiKey);
      this.lastEncryptedApiKeyPlaintext = this.settings.geminiApiKey;
      this.lastEncryptedApiKeyCiphertext = storedApiKey;
    } catch (err) {
      this.settings.geminiApiKey = "";
      this.lastEncryptedApiKeyPlaintext = undefined;
      this.lastEncryptedApiKeyCiphertext = undefined;
      if (storedApiKey) {
        new Notice(
          "RAG Chat: Google API key (GEMINI_API_KEY) konnte nicht entschlüsselt werden (anderes Gerät oder beschädigte Daten?) - bitte in den Einstellungen erneut eingeben.",
          10000
        );
      }
    }

    const storedTtsApiKey = raw.ttsApiKey as string | undefined;
    try {
      this.settings.ttsApiKey = await decryptSecret(storedTtsApiKey);
      this.lastEncryptedTtsApiKeyPlaintext = this.settings.ttsApiKey;
      this.lastEncryptedTtsApiKeyCiphertext = storedTtsApiKey;
    } catch (err) {
      this.settings.ttsApiKey = "";
      this.lastEncryptedTtsApiKeyPlaintext = undefined;
      this.lastEncryptedTtsApiKeyCiphertext = undefined;
      if (storedTtsApiKey) {
        new Notice(
          "RAG Chat: TTS API-Key konnte nicht entschlüsselt werden (anderes Gerät oder beschädigte Daten?) - bitte in den Einstellungen erneut eingeben.",
          10000
        );
      }
    }
  }

  async saveSettings(): Promise<void> {
    const toPersist: Record<string, unknown> = { ...this.settings };

    if (this.settings.geminiApiKey === this.lastEncryptedApiKeyPlaintext && this.lastEncryptedApiKeyCiphertext !== undefined) {
      toPersist.geminiApiKey = this.lastEncryptedApiKeyCiphertext;
    } else {
      const encrypted = await encryptSecret(this.settings.geminiApiKey);
      toPersist.geminiApiKey = encrypted;
      this.lastEncryptedApiKeyPlaintext = this.settings.geminiApiKey;
      this.lastEncryptedApiKeyCiphertext = encrypted;
    }

    if (
      this.settings.ttsApiKey === this.lastEncryptedTtsApiKeyPlaintext &&
      this.lastEncryptedTtsApiKeyCiphertext !== undefined
    ) {
      toPersist.ttsApiKey = this.lastEncryptedTtsApiKeyCiphertext;
    } else {
      const encrypted = await encryptSecret(this.settings.ttsApiKey);
      toPersist.ttsApiKey = encrypted;
      this.lastEncryptedTtsApiKeyPlaintext = this.settings.ttsApiKey;
      this.lastEncryptedTtsApiKeyCiphertext = encrypted;
    }

    await this.saveData(toPersist);
  }
}
