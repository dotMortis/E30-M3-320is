import { Setting, type ButtonComponent, type DropdownComponent } from "obsidian";
import type RagChatPlugin from "../../main";
import { listChirp3Voices, type Chirp3VoiceInfo } from "../../tts/voices";
import { addSecretText } from "../controls/secret-text";

export function renderTtsVoiceSection(containerEl: HTMLElement, plugin: RagChatPlugin): void {
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
      toggle.setValue(plugin.settings.ttsEnabled).onChange(async (value) => {
        plugin.settings.ttsEnabled = value;
        await plugin.saveSettings();
      }),
    );

  addSecretText(containerEl, {
    name: "TTS API key",
    desc:
      "Separater Google Cloud API-Key für Text-to-Speech (optional). Benötigt aktivierte Cloud " +
      "Text-to-Speech API und Billing im zugehörigen Projekt. Leer = Sprachausgabe deaktiviert.",
    getValue: () => plugin.settings.ttsApiKey,
    setValue: async (value) => {
      plugin.settings.ttsApiKey = value;
      await plugin.saveSettings();
    },
  });

  renderVoicePickers(containerEl, plugin);
}

function renderVoicePickers(containerEl: HTMLElement, plugin: RagChatPlugin): void {
  let languageDropdown: DropdownComponent | undefined;
  let voiceDropdown: DropdownComponent | undefined;
  let voiceRefreshButton: ButtonComponent | undefined;
  let voicesCache: Chirp3VoiceInfo[] = [];

  const populateVoiceOptions = (languageCode: string): void => {
    if (!voiceDropdown) return;
    const currentVoice = plugin.settings.ttsVoiceName;
    const names = voicesCache.filter((v) => v.languageCodes.includes(languageCode)).map((v) => v.name);
    const options = names.includes(currentVoice) ? names : [currentVoice, ...names];

    voiceDropdown.selectEl.empty();
    for (const name of options) voiceDropdown.addOption(name, name);
    voiceDropdown.setValue(currentVoice);
  };

  const refreshVoiceOptions = async (): Promise<void> => {
    if (!languageDropdown || !voiceDropdown) return;
    languageDropdown.setDisabled(true);
    voiceDropdown.setDisabled(true);
    voiceRefreshButton?.setDisabled(true);

    voicesCache = await listChirp3Voices(plugin.settings.ttsApiKey);

    const currentLanguage = plugin.settings.ttsLanguageCode;
    const languageCodes = Array.from(new Set(voicesCache.flatMap((v) => v.languageCodes))).sort();
    const languageOptions = languageCodes.includes(currentLanguage) ? languageCodes : [currentLanguage, ...languageCodes];

    languageDropdown.selectEl.empty();
    for (const code of languageOptions) languageDropdown.addOption(code, code);
    languageDropdown.setValue(currentLanguage);

    populateVoiceOptions(currentLanguage);

    languageDropdown.setDisabled(false);
    voiceDropdown.setDisabled(false);
    voiceRefreshButton?.setDisabled(false);
  };

  new Setting(containerEl).setName("Sprache").addDropdown((dropdown) => {
    languageDropdown = dropdown;
    dropdown.addOption(plugin.settings.ttsLanguageCode, plugin.settings.ttsLanguageCode);
    dropdown.setValue(plugin.settings.ttsLanguageCode);
    dropdown.onChange(async (value) => {
      plugin.settings.ttsLanguageCode = value;
      await plugin.saveSettings();
      populateVoiceOptions(value);
    });
  });

  new Setting(containerEl)
    .setName("Stimme (Chirp 3: HD)")
    .addDropdown((dropdown) => {
      voiceDropdown = dropdown;
      dropdown.addOption(plugin.settings.ttsVoiceName, plugin.settings.ttsVoiceName);
      dropdown.setValue(plugin.settings.ttsVoiceName);
      dropdown.onChange(async (value) => {
        plugin.settings.ttsVoiceName = value;
        await plugin.saveSettings();
      });
    })
    .addButton((button) => {
      voiceRefreshButton = button;
      button.setIcon("refresh-cw").setTooltip("Stimmenliste aktualisieren");
      button.onClick(() => {
        void refreshVoiceOptions();
      });
    });

  void refreshVoiceOptions();
}
