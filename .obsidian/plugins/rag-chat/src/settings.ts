import { App, PluginSettingTab, Setting } from "obsidian";
import type RagChatPlugin from "./main";

// Config constants (single source of truth on the TS side — mirrors
// .pipeline/rag/PLAN.md "Config constants" / build/orama_schema.mjs on the
// Python+Node side). Embeddings are hard-wired to Google (Zen has none);
// generation defaults to Zen, switchable to Google.
export type GenProvider = "zen" | "google";

export interface RagChatSettings {
  /** Zen (opencode.ai) API key — used for generation by default. */
  opencodeApiKey: string;
  /** Google API key — REQUIRED for query embeddings; used for generation if genProvider="google". */
  geminiApiKey: string;
  genProvider: GenProvider;
  embeddingModel: string;
  generationModel: string;
  /** Must match the shipped index's dims (see rag-manifest.json), NOT the 3072 cache dims. */
  outputDim: number;
  topK: number;
  similarity: number;
}

export const DEFAULT_SETTINGS: RagChatSettings = {
  opencodeApiKey: "",
  geminiApiKey: "",
  genProvider: "zen",
  embeddingModel: "gemini-embedding-2",
  generationModel: "gemini-3.6-flash",
  outputDim: 768,
  topK: 8,
  similarity: 0.75,
};

export class RagChatSettingTab extends PluginSettingTab {
  plugin: RagChatPlugin;

  constructor(app: App, plugin: RagChatPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();
    const { containerEl } = this;

    containerEl.createEl("h2", { text: "RAG Chat" });
    containerEl.createEl("p", {
      text:
        "Embeddings always use Google (gemini-embedding-2) - Zen has no embedding model. " +
        "Generation defaults to Zen (gemini-3.6-flash) and is switchable to Google below.",
    });

    new Setting(containerEl)
      .setName("Google API key (GEMINI_API_KEY)")
      .setDesc("Required for query embeddings. Also used for generation if the provider below is set to Google.")
      .addText((text) =>
        text
          .setPlaceholder("AIza...")
          .setValue(this.plugin.settings.geminiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.geminiApiKey = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("OpenCode Zen API key (OPENCODE_API_KEY)")
      .setDesc("Used for generation when the provider below is set to Zen (the default).")
      .addText((text) =>
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.opencodeApiKey)
          .onChange(async (value) => {
            this.plugin.settings.opencodeApiKey = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Generation provider")
      .setDesc("Zen keeps the Google generation budget untouched; embeddings always go to Google regardless of this toggle.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("zen", "Zen (opencode.ai)")
          .addOption("google", "Google")
          .setValue(this.plugin.settings.genProvider)
          .onChange(async (value) => {
            this.plugin.settings.genProvider = value as GenProvider;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Embedding model")
      .setDesc("Must match the model the index was built with (see rag-manifest.json). Google-only.")
      .addText((text) =>
        text.setValue(this.plugin.settings.embeddingModel).onChange(async (value) => {
          this.plugin.settings.embeddingModel = value.trim();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Generation model")
      .addText((text) =>
        text.setValue(this.plugin.settings.generationModel).onChange(async (value) => {
          this.plugin.settings.generationModel = value.trim();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Output dimensions")
      .setDesc("Must match rag-manifest.json's embeddingDims (768 for the shipped index) - not the 3072 build-time cache dims.")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.outputDim)).onChange(async (value) => {
          const n = parseInt(value, 10);
          if (!Number.isNaN(n) && n > 0) {
            this.plugin.settings.outputDim = n;
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("Top K")
      .setDesc("Number of retrieval hits to consider (before parent-note dedup).")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.topK)).onChange(async (value) => {
          const n = parseInt(value, 10);
          if (!Number.isNaN(n) && n > 0) {
            this.plugin.settings.topK = n;
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("Similarity threshold")
      .setDesc("Minimum vector similarity for hybrid/vector search (0-1).")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.similarity)).onChange(async (value) => {
          const n = parseFloat(value);
          if (!Number.isNaN(n) && n >= 0 && n <= 1) {
            this.plugin.settings.similarity = n;
            await this.plugin.saveSettings();
          }
        })
      );
  }
}
