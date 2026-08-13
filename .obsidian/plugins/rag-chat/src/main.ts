import { FileSystemAdapter, Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, RagChatSettingTab, type RagChatSettings } from "./settings";
import { RAG_CHAT_VIEW_TYPE, RagChatView } from "./view";
import { validateManifest, type RagManifest } from "./retriever";
import { decryptSecret, encryptSecret } from "./secure-storage";

/** Settings fields that are encrypted at rest (see secure-storage.ts). Kept as
 * plaintext on `this.settings` in memory - only encrypted right before
 * saveData() and decrypted right after loadData(). */
const ENCRYPTED_FIELDS: { field: "geminiApiKey"; label: string }[] = [
  { field: "geminiApiKey", label: "Google API key (GEMINI_API_KEY)" },
];

export default class RagChatPlugin extends Plugin {
  settings!: RagChatSettings;
  private manifestCache: RagManifest | null = null;

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

    this.addSettingTab(new RagChatSettingTab(this.app, this));

    // Validate the shipped index manifest against settings on load, warn (don't
    // block) on mismatch - see PLAN.md "embedding-parity guard".
    try {
      const manifest = await this.getManifest();
      const warnings = validateManifest(manifest, this.settings);
      for (const w of warnings) new Notice(`RAG Chat: ${w}`, 10000);
    } catch (err) {
      new Notice(
        `RAG Chat: konnte rag-manifest.json nicht laden (${err instanceof Error ? err.message : String(err)}). Index ggf. neu bauen.`,
        10000
      );
    }
  }

  onunload(): void {
    // no-op: registered view/commands are cleaned up automatically by Obsidian.
  }

  getPluginDir(): string {
    // this.manifest.dir is populated by Obsidian at runtime with the vault-relative plugin path.
    return this.manifest.dir ?? `.obsidian/plugins/${this.manifest.id}`;
  }

  /** Real filesystem path to the plugin directory (not vault-relative) -
   * needed for Node's fs-based restoreFromFile/persistToFile (see
   * orama-schema.ts). isDesktopOnly: true, so the adapter is always a
   * FileSystemAdapter (never the mobile Capacitor adapter). */
  getPluginDirFullPath(): string {
    const relPath = this.getPluginDir();
    if (this.app.vault.adapter instanceof FileSystemAdapter) {
      return this.app.vault.adapter.getFullPath(relPath);
    }
    return relPath;
  }

  async getManifest(): Promise<RagManifest> {
    if (this.manifestCache) return this.manifestCache;
    const relPath = `${this.getPluginDir()}/rag-manifest.json`;
    const raw = await this.app.vault.adapter.read(relPath);
    this.manifestCache = JSON.parse(raw) as RagManifest;
    return this.manifestCache;
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(RAG_CHAT_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: RAG_CHAT_VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    const raw = ((await this.loadData()) ?? {}) as Record<string, unknown>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw) as RagChatSettings;

    // geminiApiKey is persisted encrypted (see secure-storage.ts) - decrypt it
    // into the in-memory settings object here so the rest of the plugin
    // (retriever.ts, gemini.ts, settings.ts) keeps working with plaintext.
    for (const { field, label } of ENCRYPTED_FIELDS) {
      const storedValue = raw[field] as string | undefined;
      try {
        this.settings[field] = await decryptSecret(storedValue);
      } catch (err) {
        this.settings[field] = "";
        if (storedValue) {
          new Notice(
            `RAG Chat: ${label} konnte nicht entschlüsselt werden (anderes Gerät oder beschädigte Daten?) - bitte in den Einstellungen erneut eingeben.`,
            10000
          );
        }
      }
    }
  }

  async saveSettings(): Promise<void> {
    const toPersist: Record<string, unknown> = { ...this.settings };
    for (const { field } of ENCRYPTED_FIELDS) {
      toPersist[field] = await encryptSecret(this.settings[field]);
    }
    await this.saveData(toPersist);
  }
}
