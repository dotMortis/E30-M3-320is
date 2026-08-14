import { App, PluginSettingTab, Setting, type ButtonComponent, type DropdownComponent } from "obsidian";
import type RagChatPlugin from "../main";
import { listFlashModels } from "../gemini/models";

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
      text: "Google (gemini-embedding-2 for embeddings, a selectable Gemini Flash model for generation) is used for both query embeddings and generation.",
    });

    let apiKeyInputEl: HTMLInputElement | undefined;
    new Setting(containerEl)
      .setName("Google API key (GEMINI_API_KEY)")
      .setDesc("Required for query embeddings and generation.")
      .addText((text) => {
        text
          .setPlaceholder("AIza...")
          .setValue(this.plugin.settings.geminiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.geminiApiKey = value.trim();
            await this.plugin.saveSettings();
          });
        apiKeyInputEl = text.inputEl;
        apiKeyInputEl.type = "password";
      })
      .addButton((button) => {
        button.setIcon("eye").setTooltip("API-Schlüssel anzeigen/verbergen");
        button.onClick(() => {
          if (!apiKeyInputEl) return;
          const revealed = apiKeyInputEl.type === "text";
          apiKeyInputEl.type = revealed ? "password" : "text";
          button.setIcon(revealed ? "eye" : "eye-off");
        });
      });

    new Setting(containerEl)
      .setName("Embedding model")
      .setDesc("Must match the model the index was built with (see rag-manifest.json). Google-only.")
      .addText((text) =>
        text.setValue(this.plugin.settings.embeddingModel).onChange(async (value) => {
          this.plugin.settings.embeddingModel = value.trim();
          await this.plugin.saveSettings();
          await this.plugin.revalidateManifest();
        })
      );

    let modelDropdown: DropdownComponent | undefined;
    let modelRefreshButton: ButtonComponent | undefined;

    const refreshModelOptions = async (): Promise<void> => {
      if (!modelDropdown) return;
      const currentModel = this.plugin.settings.generationModel;
      modelDropdown.setDisabled(true);
      modelRefreshButton?.setDisabled(true);

      const models = await listFlashModels(this.plugin.settings.geminiApiKey);
      const options = models.some((model) => model.id === currentModel)
        ? models
        : [{ id: currentModel, displayName: currentModel }, ...models];

      modelDropdown.selectEl.empty();
      for (const model of options) modelDropdown.addOption(model.id, model.displayName);
      modelDropdown.setValue(currentModel);
      modelDropdown.setDisabled(false);
      modelRefreshButton?.setDisabled(false);
    };

    new Setting(containerEl)
      .setName("Generation model")
      .addDropdown((dropdown) => {
        modelDropdown = dropdown;
        dropdown.addOption(this.plugin.settings.generationModel, this.plugin.settings.generationModel);
        dropdown.setValue(this.plugin.settings.generationModel);
        dropdown.onChange(async (value) => {
          this.plugin.settings.generationModel = value;
          await this.plugin.saveSettings();
        });
      })
      .addButton((button) => {
        modelRefreshButton = button;
        button.setIcon("refresh-cw").setTooltip("Modellliste aktualisieren");
        button.onClick(() => {
          void refreshModelOptions();
        });
      });

    void refreshModelOptions();

    new Setting(containerEl)
      .setName("Output dimensions")
      .setDesc("Must match rag-manifest.json's embeddingDims (3072 - full-fidelity, no truncation).")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.outputDim)).onChange(async (value) => {
          const n = parseInt(value, 10);
          if (!Number.isNaN(n) && n > 0) {
            this.plugin.settings.outputDim = n;
            await this.plugin.saveSettings();
            await this.plugin.revalidateManifest();
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
