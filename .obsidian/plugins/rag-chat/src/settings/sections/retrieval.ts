import { Setting } from "obsidian";
import type RagChatPlugin from "../../main";
import { addNumberField } from "../controls/number-field";

export function renderRetrievalSection(containerEl: HTMLElement, plugin: RagChatPlugin): void {
  new Setting(containerEl)
    .setName("Embedding model")
    .setDesc("Must match the model the index was built with (see rag-manifest.json). Google-only.")
    .addText((text) =>
      text.setValue(plugin.settings.embeddingModel).onChange(async (value) => {
        plugin.settings.embeddingModel = value.trim();
        await plugin.saveSettings();
        await plugin.revalidateManifest();
      }),
    );
}

export function renderRetrievalKnobs(containerEl: HTMLElement, plugin: RagChatPlugin): void {
  addNumberField(containerEl, {
    name: "Output dimensions",
    desc: "Must match rag-manifest.json's embeddingDims (3072 - full-fidelity, no truncation).",
    getValue: () => plugin.settings.outputDim,
    isValid: (n) => n > 0,
    onValid: async (n) => {
      plugin.settings.outputDim = n;
      await plugin.saveSettings();
      await plugin.revalidateManifest();
    },
  });

  addNumberField(containerEl, {
    name: "Top K",
    desc: "Number of retrieval hits to consider (before parent-note dedup).",
    getValue: () => plugin.settings.topK,
    isValid: (n) => n > 0,
    onValid: async (n) => {
      plugin.settings.topK = n;
      await plugin.saveSettings();
    },
  });

  addNumberField(containerEl, {
    name: "Similarity threshold",
    desc:
      "Minimum vector similarity for the vector leg (0-1). Measured on this corpus: real " +
      "natural-language queries top out around 0.60-0.75 cosine similarity even for the exact " +
      "correct page — setting this above ~0.75 silently disables the vector leg entirely on most " +
      "real questions. Default 0.55 is calibrated from live benchmarking, not a guess.",
    getValue: () => plugin.settings.similarity,
    parse: (raw) => parseFloat(raw),
    isValid: (n) => n >= 0 && n <= 1,
    onValid: async (n) => {
      plugin.settings.similarity = n;
      await plugin.saveSettings();
    },
  });

  addNumberField(containerEl, {
    name: "Hybrid fusion (RRF) k",
    desc:
      "Reciprocal Rank Fusion constant merging the BM25 and vector leg rankings. Small values " +
      "(1-10) were empirically best on this corpus; the common literature default of 60 buried " +
      "single-leg-exclusive top matches under documents merely mediocre on both legs.",
    getValue: () => plugin.settings.rrfK,
    isValid: (n) => n > 0,
    onValid: async (n) => {
      plugin.settings.rrfK = n;
      await plugin.saveSettings();
    },
  });
}
