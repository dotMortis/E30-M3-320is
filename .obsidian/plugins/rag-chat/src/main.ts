import { FileSystemAdapter, Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, RagChatSettingTab, type RagChatSettings } from "./settings";
import { RAG_CHAT_VIEW_TYPE, RagChatView } from "./view";
import { validateManifest, type RagManifest } from "./retriever";

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

  getIndexPath(): string {
    // isDesktopOnly: true, so the adapter is always a FileSystemAdapter (never the mobile
    // Capacitor adapter) - we need the real filesystem path for Node's fs-based
    // restoreFromFile/persistToFile (see orama-schema.ts), not a vault-relative path.
    const relPath = `${this.getPluginDir()}/rag-index.orama.msp`;
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
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
