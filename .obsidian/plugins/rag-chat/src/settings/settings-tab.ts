import { App, PluginSettingTab } from "obsidian";
import type RagChatPlugin from "../main";
import { renderApiKeySection } from "./sections/api-key";
import { renderAgentSection } from "./sections/agent";
import { renderGenerationModel } from "./sections/generation";
import { renderRetrievalKnobs, renderRetrievalSection } from "./sections/retrieval";
import { renderTtsAudioSection } from "./sections/tts-audio";
import { renderTtsVoiceSection } from "./sections/tts-voice";

export class RagChatSettingTab extends PluginSettingTab {
  plugin: RagChatPlugin;

  constructor(app: App, plugin: RagChatPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();
    const { containerEl } = this;

    renderApiKeySection(containerEl, this.plugin);
    renderRetrievalSection(containerEl, this.plugin);
    renderGenerationModel(containerEl, this.plugin);
    renderRetrievalKnobs(containerEl, this.plugin);
    renderAgentSection(containerEl, this.plugin);
    renderTtsVoiceSection(containerEl, this.plugin);
    renderTtsAudioSection(containerEl, this.plugin, this.app);
  }
}
