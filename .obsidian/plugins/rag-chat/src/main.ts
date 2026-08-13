import { Notice, Plugin, type WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, type RagChatSettings } from "./settings/types";
import { RagChatSettingTab } from "./settings/settings-tab";
import { RAG_CHAT_VIEW_TYPE, RagChatView } from "./view/view";
import { validateManifest } from "./retrieval/embeddings";
import type { RagManifest } from "./retrieval/types";
import { getPluginDir, getPluginDirFullPath, readManifest } from "./plugin/manifest";
import { decryptSecret, encryptSecret } from "./secure-storage";

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

    // Ensure the RAG Chat view is present in the right sidebar once the
    // workspace layout is ready, mirroring the vault's previous
    // show-local-graph plugin. This makes RAG Chat appear by default for
    // every user, independent of the per-user (gitignored) workspace.json
    // state, without stealing focus from the editor on startup.
    this.app.workspace.onLayoutReady(() => {
      void this.activateView({ focus: false });
    });

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

  onunload(): void {}

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
