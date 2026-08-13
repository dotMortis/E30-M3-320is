import { App, PluginSettingTab, Setting } from "obsidian";
import type RagChatPlugin from "./main";

// Config constants (single source of truth on the TS side — mirrors
// .pipeline/rag/PLAN.md "Config constants" / build/orama_schema.mjs on the
// Python+Node side). Google is the only provider — used for both query
// embeddings and generation (gemini-3.6-flash). OpenCode Zen was used only
// during development (see .pipeline/rag/gen_client.py) and is intentionally
// not wired into the shipped plugin.
export interface RagChatSettings {
  /** Google API key — required for query embeddings AND generation. Note:
   * OpenCode Zen (gen_client.py) is used for dev-only offline benchmarking/
   * smoke tests and is intentionally NOT wired into the shipped plugin —
   * production generation always uses this Google key. */
  geminiApiKey: string;
  embeddingModel: string;
  generationModel: string;
  /** Must match the shipped index's embeddingDims (see rag-manifest.json). */
  outputDim: number;
  topK: number;
  /** Minimum cosine similarity for the vector leg (0-1). NOTE: measured
   * against this corpus with gemini-embedding-2, real natural-language
   * queries top out around 0.60-0.75 cosine similarity even for the
   * exact correct document — a threshold of 0.75 (the old default)
   * empirically returned ZERO vector candidates on every tested
   * colloquial query, silently disabling the entire vector leg. 0.55
   * keeps a healthy margin below the observed 0.59-0.74 range for real
   * matches while still excluding true negatives (~0.60-0.63 ceiling
   * observed for unrelated queries in benchmarking). */
  similarity: number;
  /** Reciprocal Rank Fusion constant used to merge the BM25 (text) and
   * vector leg rankings (see retriever.ts's federatedHybridSearch). Small
   * k values (1-10) were empirically best on this corpus size (~2822
   * rows) — the traditional literature default of k=60 assumes much
   * larger candidate pools and, tested here, buried single-leg-exclusive
   * top matches under documents that were merely mediocre on both legs. */
  rrfK: number;
  /** Whether the search_manual_fuzzy tool (Vault Search's fuzzy/typo/synonym
   * search) is offered to the model at all during the agent loop (see
   * agent.ts). Requires the vault-search plugin to be installed/enabled. */
  enableFuzzySearchLeg: boolean;
  /** Hard cap on tool-calling rounds per question in the agent loop (see
   * agent.ts's runAgentLoop). Each round is one non-streaming Gemini call
   * that may return a tool call (search_manual, search_manual_fuzzy,
   * get_manual_page, ask_user) or a final answer. Once the cap is hit, tools
   * are stripped and the model is forced to answer directly with whatever
   * it has gathered so far. An ask_user round that pauses for a clarifying
   * question still consumes one round of this budget on resume. */
  maxAgentRounds: number;
}

export const DEFAULT_SETTINGS: RagChatSettings = {
  geminiApiKey: "",
  embeddingModel: "gemini-embedding-2",
  generationModel: "gemini-3.6-flash",
  outputDim: 3072,
  topK: 8,
  similarity: 0.55,
  rrfK: 2,
  enableFuzzySearchLeg: true,
  maxAgentRounds: 4,
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
      text: "Google (gemini-embedding-2 + gemini-3.6-flash) is used for both query embeddings and generation.",
    });

    new Setting(containerEl)
      .setName("Google API key (GEMINI_API_KEY)")
      .setDesc("Required for query embeddings and generation.")
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
      .setDesc("Must match rag-manifest.json's embeddingDims (3072 - full-fidelity, no truncation).")
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
      .setDesc(
        "Minimum vector similarity for the vector leg (0-1). Measured on this corpus: real " +
          "natural-language queries top out around 0.60-0.75 cosine similarity even for the exact " +
          "correct page — setting this above ~0.75 silently disables the vector leg entirely on most " +
          "real questions. Default 0.55 is calibrated from live benchmarking, not a guess."
      )
      .addText((text) =>
        text.setValue(String(this.plugin.settings.similarity)).onChange(async (value) => {
          const n = parseFloat(value);
          if (!Number.isNaN(n) && n >= 0 && n <= 1) {
            this.plugin.settings.similarity = n;
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("Hybrid fusion (RRF) k")
      .setDesc(
        "Reciprocal Rank Fusion constant merging the BM25 and vector leg rankings. Small values " +
          "(1-10) were empirically best on this corpus; the common literature default of 60 buried " +
          "single-leg-exclusive top matches under documents merely mediocre on both legs."
      )
      .addText((text) =>
        text.setValue(String(this.plugin.settings.rrfK)).onChange(async (value) => {
          const n = parseInt(value, 10);
          if (!Number.isNaN(n) && n > 0) {
            this.plugin.settings.rrfK = n;
            await this.plugin.saveSettings();
          }
        })
      );

    containerEl.createEl("h3", { text: "Agenten-Schleife (Werkzeuge & Rückfragen)" });
    containerEl.createEl("p", {
      text:
        "RAG Chat beantwortet Fragen nicht mehr nur aus dem Handbuch: das Modell kann selbst " +
        "entscheiden, erneut zu suchen, eine bestimmte Seite vollständig nachzuladen, das Web " +
        "zu durchsuchen oder dich um eine Klärung zu bitten - begrenzt durch ein festes Budget " +
        "an Werkzeug-Runden pro Frage.",
    });

    new Setting(containerEl)
      .setName("Vault-Search-Werkzeug anbieten")
      .setDesc(
        "Bietet dem Modell die tippfehler-/synonymtolerante Handbuchsuche (Plugin \"vault-search\") " +
          "als eigenständiges Werkzeug an. Benötigt das vault-search-Plugin (aktiviert)."
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableFuzzySearchLeg).onChange(async (value) => {
          this.plugin.settings.enableFuzzySearchLeg = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Max. Werkzeug-Runden")
      .setDesc(
        "Hartes Limit an Werkzeug-Aufrufen (erneute Suche, Seite nachladen, Rückfrage) pro Frage, " +
          "bevor das Modell gezwungen wird, direkt zu antworten. Eine Rückfrage an dich verbraucht " +
          "beim Fortsetzen ebenfalls eine Runde dieses Budgets."
      )
      .addText((text) =>
        text.setValue(String(this.plugin.settings.maxAgentRounds)).onChange(async (value) => {
          const n = parseInt(value, 10);
          if (!Number.isNaN(n) && n > 0) {
            this.plugin.settings.maxAgentRounds = n;
            await this.plugin.saveSettings();
          }
        })
      );
  }
}
