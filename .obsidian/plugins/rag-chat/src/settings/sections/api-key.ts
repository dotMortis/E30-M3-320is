import type RagChatPlugin from "../../main";
import { addSecretText } from "../controls/secret-text";

export function renderApiKeySection(containerEl: HTMLElement, plugin: RagChatPlugin): void {
  containerEl.createEl("h2", { text: "RAG Chat" });
  containerEl.createEl("p", {
    text: "Google (gemini-embedding-2 for embeddings, a selectable Gemini Flash model for generation) is used for both query embeddings and generation.",
  });

  addSecretText(containerEl, {
    name: "Google API key (GEMINI_API_KEY)",
    desc: "Required for query embeddings and generation.",
    getValue: () => plugin.settings.geminiApiKey,
    setValue: async (value) => {
      plugin.settings.geminiApiKey = value;
      await plugin.saveSettings();
    },
  });
}
