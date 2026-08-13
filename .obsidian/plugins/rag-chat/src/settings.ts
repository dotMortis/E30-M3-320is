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
  /** Merge in Vault Search's fuzzy/typo/synonym-aware results as a third
   * retrieval leg on every query (see retriever.ts's mergeWithFuzzy). */
  enableFuzzySearchLeg: boolean;
  /** If the first retrieval pass looks thin (see workflow.ts's isWeak), retry
   * once with a loosened similarity threshold, and - if still thin - fall
   * back to an LLM-rewritten query. Set to 0 to disable automatic retries. */
  maxRetries: number;
  /** Below this merged score, a top hit is considered "thin" (0-1 scale). */
  weakResultScoreThreshold: number;
  /** Fewer than this many retrieved documents is also considered "thin". */
  weakResultMinHits: number;
  /** Ask the LLM to rewrite the question (using conversation history) as a
   * last-resort retry when deterministic retrieval still comes back thin.
   * Costs one extra non-streaming Gemini call, only when triggered. */
  enableQueryRewriteFallback: boolean;
  /** After generating a draft answer, ask the LLM to critique whether it's
   * actually supported by the retrieved context, and regenerate once (with
   * broadened retrieval) if not. Costs one extra non-streaming Gemini call
   * per turn, plus a possible regeneration. */
  enableSelfCritique: boolean;
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
  maxRetries: 1,
  weakResultScoreThreshold: 0.35,
  weakResultMinHits: 2,
  enableQueryRewriteFallback: true,
  enableSelfCritique: true,
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

    containerEl.createEl("h3", { text: "Reasoning-Workflow (Retrieval-Qualität)" });
    containerEl.createEl("p", {
      text:
        "Diese Optionen adressieren Fälle, in denen RAG Chat eine Seite nicht findet, " +
        "die die Handbuchsuche (Fuzzy Search) findet - z.B. bei Tippfehlern oder " +
        "umgangssprachlichen Formulierungen.",
    });

    new Setting(containerEl)
      .setName("Vault-Search-Ergebnisse einbeziehen")
      .setDesc(
        "Nutzt die tippfehler-/synonymtolerante Handbuchsuche (Plugin \"vault-search\") als " +
          "zusätzliche Quelle bei jeder Frage. Benötigt das vault-search-Plugin (aktiviert)."
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableFuzzySearchLeg).onChange(async (value) => {
          this.plugin.settings.enableFuzzySearchLeg = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Max. Wiederholungen")
      .setDesc("Wie oft bei schwachen Treffern automatisch breiter gesucht/neu generiert wird (0 = aus).")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.maxRetries)).onChange(async (value) => {
          const n = parseInt(value, 10);
          if (!Number.isNaN(n) && n >= 0) {
            this.plugin.settings.maxRetries = n;
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("Schwellwert für \"schwache\" Treffer")
      .setDesc("Bester gemischter Score (0-1) unterhalb dessen ein Retry ausgelöst wird.")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.weakResultScoreThreshold)).onChange(async (value) => {
          const n = parseFloat(value);
          if (!Number.isNaN(n) && n >= 0 && n <= 1) {
            this.plugin.settings.weakResultScoreThreshold = n;
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("Mindestanzahl Treffer")
      .setDesc("Weniger als diese Anzahl gefundener Seiten löst ebenfalls einen Retry aus.")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.weakResultMinHits)).onChange(async (value) => {
          const n = parseInt(value, 10);
          if (!Number.isNaN(n) && n >= 0) {
            this.plugin.settings.weakResultMinHits = n;
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("LLM-Suchanfragen-Umformulierung (Fallback)")
      .setDesc(
        "Wenn Retrieval weiterhin schwach bleibt, die Frage per LLM anhand des Gesprächsverlaufs " +
          "umformulieren und erneut suchen. Kostet einen zusätzlichen Gemini-Aufruf, nur bei Bedarf."
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableQueryRewriteFallback).onChange(async (value) => {
          this.plugin.settings.enableQueryRewriteFallback = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Antwort-Selbstprüfung (LLM)")
      .setDesc(
        "Nach der Generierung per LLM prüfen, ob die Antwort wirklich durch den Kontext gestützt " +
          "wird, und bei Bedarf einmal mit breiterer Suche neu generieren. Kostet einen " +
          "zusätzlichen Gemini-Aufruf pro Frage."
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableSelfCritique).onChange(async (value) => {
          this.plugin.settings.enableSelfCritique = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
