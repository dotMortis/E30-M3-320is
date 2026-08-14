import { Setting } from "obsidian";
import type RagChatPlugin from "../../main";
import { addNumberField } from "../controls/number-field";

export function renderAgentSection(containerEl: HTMLElement, plugin: RagChatPlugin): void {
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
        "als eigenständiges Werkzeug an. Benötigt das vault-search-Plugin (aktiviert).",
    )
    .addToggle((toggle) =>
      toggle.setValue(plugin.settings.enableFuzzySearchLeg).onChange(async (value) => {
        plugin.settings.enableFuzzySearchLeg = value;
        await plugin.saveSettings();
      }),
    );

  addNumberField(containerEl, {
    name: "Max. Werkzeug-Runden",
    desc:
      "Hartes Limit an Werkzeug-Aufrufen (erneute Suche, Seite nachladen, Rückfrage) pro Frage, " +
      "bevor das Modell gezwungen wird, direkt zu antworten. Eine Rückfrage an dich verbraucht " +
      "beim Fortsetzen ebenfalls eine Runde dieses Budgets.",
    getValue: () => plugin.settings.maxAgentRounds,
    isValid: (n) => n > 0,
    onValid: async (n) => {
      plugin.settings.maxAgentRounds = n;
      await plugin.saveSettings();
    },
  });
}
