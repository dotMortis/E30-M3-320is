import { App, PluginSettingTab, Setting, type ButtonComponent, type DropdownComponent } from "obsidian";
import type RagChatPlugin from "../main";
import { listFlashModels } from "../gemini/models";
import { listChirp3Voices, type Chirp3VoiceInfo } from "../tts/voices";
import { listOutputDevices, unlockDeviceLabels } from "../tts/devices";
import * as ttsPlayback from "../tts/playback";
import { confirmModal } from "../view/confirm-modal";
import { TTS_FREE_TIER_CHAR_LIMIT } from "../constants";

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

    containerEl.createEl("h3", { text: "Sprachausgabe (TTS)" });
    containerEl.createEl("p", {
      text:
        "Optional: zusätzlich zur gewohnten, zitatreichen Antwort wird eine kurze, gesprochene " +
        "Zusammenfassung erzeugt und über Google Cloud Text-to-Speech (Chirp 3: HD) abgespielt - " +
        "z.B. für die Werkstatt, um ein Anzugsdrehmoment vorgelesen zu bekommen.",
    });

    new Setting(containerEl)
      .setName("Sprachausgabe aktivieren")
      .setDesc("Setzt den Anfangszustand der Sprachausgabe-Checkbox im Chat (dort jederzeit umschaltbar).")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.ttsEnabled).onChange(async (value) => {
          this.plugin.settings.ttsEnabled = value;
          await this.plugin.saveSettings();
        })
      );

    let ttsApiKeyInputEl: HTMLInputElement | undefined;
    new Setting(containerEl)
      .setName("TTS API key")
      .setDesc(
        "Separater Google Cloud API-Key für Text-to-Speech (optional). Benötigt aktivierte Cloud " +
          "Text-to-Speech API und Billing im zugehörigen Projekt. Leer = es wird versucht, den " +
          "Gemini-Key oben zu verwenden."
      )
      .addText((text) => {
        text
          .setPlaceholder("AIza...")
          .setValue(this.plugin.settings.ttsApiKey)
          .onChange(async (value) => {
            this.plugin.settings.ttsApiKey = value.trim();
            await this.plugin.saveSettings();
          });
        ttsApiKeyInputEl = text.inputEl;
        ttsApiKeyInputEl.type = "password";
      })
      .addButton((button) => {
        button.setIcon("eye").setTooltip("API-Schlüssel anzeigen/verbergen");
        button.onClick(() => {
          if (!ttsApiKeyInputEl) return;
          const revealed = ttsApiKeyInputEl.type === "text";
          ttsApiKeyInputEl.type = revealed ? "password" : "text";
          button.setIcon(revealed ? "eye" : "eye-off");
        });
      });

    let ttsLanguageDropdown: DropdownComponent | undefined;
    let ttsVoiceDropdown: DropdownComponent | undefined;
    let ttsVoiceRefreshButton: ButtonComponent | undefined;
    let ttsVoicesCache: Chirp3VoiceInfo[] = [];

    const populateTtsVoiceOptions = (languageCode: string): void => {
      if (!ttsVoiceDropdown) return;
      const currentVoice = this.plugin.settings.ttsVoiceName;
      const names = ttsVoicesCache.filter((v) => v.languageCodes.includes(languageCode)).map((v) => v.name);
      const options = names.includes(currentVoice) ? names : [currentVoice, ...names];

      ttsVoiceDropdown.selectEl.empty();
      for (const name of options) ttsVoiceDropdown.addOption(name, name);
      ttsVoiceDropdown.setValue(currentVoice);
    };

    const refreshTtsVoiceOptions = async (): Promise<void> => {
      if (!ttsLanguageDropdown || !ttsVoiceDropdown) return;
      const apiKey = this.plugin.settings.ttsApiKey || this.plugin.settings.geminiApiKey;
      ttsLanguageDropdown.setDisabled(true);
      ttsVoiceDropdown.setDisabled(true);
      ttsVoiceRefreshButton?.setDisabled(true);

      ttsVoicesCache = await listChirp3Voices(apiKey);

      const currentLanguage = this.plugin.settings.ttsLanguageCode;
      const languageCodes = Array.from(new Set(ttsVoicesCache.flatMap((v) => v.languageCodes))).sort();
      const languageOptions = languageCodes.includes(currentLanguage) ? languageCodes : [currentLanguage, ...languageCodes];

      ttsLanguageDropdown.selectEl.empty();
      for (const code of languageOptions) ttsLanguageDropdown.addOption(code, code);
      ttsLanguageDropdown.setValue(currentLanguage);

      populateTtsVoiceOptions(currentLanguage);

      ttsLanguageDropdown.setDisabled(false);
      ttsVoiceDropdown.setDisabled(false);
      ttsVoiceRefreshButton?.setDisabled(false);
    };

    new Setting(containerEl)
      .setName("Sprache")
      .addDropdown((dropdown) => {
        ttsLanguageDropdown = dropdown;
        dropdown.addOption(this.plugin.settings.ttsLanguageCode, this.plugin.settings.ttsLanguageCode);
        dropdown.setValue(this.plugin.settings.ttsLanguageCode);
        dropdown.onChange(async (value) => {
          this.plugin.settings.ttsLanguageCode = value;
          await this.plugin.saveSettings();
          populateTtsVoiceOptions(value);
        });
      });

    new Setting(containerEl)
      .setName("Stimme (Chirp 3: HD)")
      .addDropdown((dropdown) => {
        ttsVoiceDropdown = dropdown;
        dropdown.addOption(this.plugin.settings.ttsVoiceName, this.plugin.settings.ttsVoiceName);
        dropdown.setValue(this.plugin.settings.ttsVoiceName);
        dropdown.onChange(async (value) => {
          this.plugin.settings.ttsVoiceName = value;
          await this.plugin.saveSettings();
        });
      })
      .addButton((button) => {
        ttsVoiceRefreshButton = button;
        button.setIcon("refresh-cw").setTooltip("Stimmenliste aktualisieren");
        button.onClick(() => {
          void refreshTtsVoiceOptions();
        });
      });

    void refreshTtsVoiceOptions();

    let ttsDeviceDropdown: DropdownComponent | undefined;

    const refreshTtsDeviceOptions = async (): Promise<void> => {
      if (!ttsDeviceDropdown) return;
      const devices = await listOutputDevices();
      const current = this.plugin.settings.ttsOutputDeviceId;

      ttsDeviceDropdown.selectEl.empty();
      ttsDeviceDropdown.addOption("", "Systemstandard");
      for (const device of devices) {
        if (!device.deviceId || device.deviceId === "default") continue;
        ttsDeviceDropdown.addOption(device.deviceId, device.label || `Gerät ${device.deviceId.slice(0, 8)}`);
      }
      const hasCurrent = current === "" || devices.some((d) => d.deviceId === current);
      ttsDeviceDropdown.setValue(hasCurrent ? current : "");
    };

    new Setting(containerEl)
      .setName("Audioausgabegerät")
      .setDesc(
        "\"Geräte erkennen\" fragt einmalig nach Mikrofonberechtigung, nur um Gerätenamen auszulesen " +
          "- es wird nichts aufgenommen oder übertragen."
      )
      .addDropdown((dropdown) => {
        ttsDeviceDropdown = dropdown;
        dropdown.addOption("", "Systemstandard");
        dropdown.onChange(async (value) => {
          this.plugin.settings.ttsOutputDeviceId = value;
          await this.plugin.saveSettings();
        });
      })
      .addButton((button) => {
        button.setButtonText("Geräte erkennen");
        button.onClick(async () => {
          button.setDisabled(true);
          await unlockDeviceLabels();
          await refreshTtsDeviceOptions();
          button.setDisabled(false);
        });
      });

    void refreshTtsDeviceOptions();

    new Setting(containerEl)
      .setName("Lautstärke")
      .addSlider((slider) =>
        slider
          .setLimits(0, 1, 0.05)
          .setValue(this.plugin.settings.ttsVolume)
          .setDynamicTooltip()
          .onChange(async (value) => {
            ttsPlayback.setVolume(value);
            this.plugin.settings.ttsVolume = value;
            await this.plugin.saveSettings();
          })
      );

    const charCounterSetting = new Setting(containerEl).setName("Zeichenzähler (Chirp 3 HD)");
    const updateCharCounterDesc = (): void => {
      const used = this.plugin.settings.ttsCharCount.toLocaleString("de-DE");
      const limit = TTS_FREE_TIER_CHAR_LIMIT.toLocaleString("de-DE");
      charCounterSetting.setDesc(`${used} / ${limit} Zeichen (Freikontingent).`);
    };
    updateCharCounterDesc();
    charCounterSetting.addButton((button) => {
      button.setButtonText("Zurücksetzen").setWarning();
      button.onClick(async () => {
        const confirmed = await confirmModal(this.app, "Zeichenzähler wirklich zurücksetzen?");
        if (!confirmed) return;
        this.plugin.settings.ttsCharCount = 0;
        await this.plugin.saveSettings();
        updateCharCounterDesc();
      });
    });
  }
}
