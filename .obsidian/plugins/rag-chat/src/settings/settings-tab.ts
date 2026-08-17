import { App, PluginSettingTab } from "obsidian";
import type RagChatPlugin from "../main";
import { renderApiKeySection } from "./sections/api-key";
import { renderAgentSection } from "./sections/agent";
import { renderGenerationModel } from "./sections/generation";
import { renderMicInputSection } from "./sections/mic-input";
import { renderRemoteSection } from "./sections/remote";
import { renderRetrievalKnobs, renderRetrievalSection } from "./sections/retrieval";
import { renderSecuritySection } from "./sections/security";
import { renderTtsAudioSection } from "./sections/tts-audio";
import { renderTtsVoiceSection } from "./sections/tts-voice";

export class RagChatSettingTab extends PluginSettingTab {
  plugin: RagChatPlugin;
  /** Unsubscribes the remote section from live bridge status updates. */
  private disposeRemoteSection: (() => void) | null = null;
  /** Unsubscribes the security section from lock-state updates. */
  private disposeSecuritySection: (() => void) | null = null;

  constructor(app: App, plugin: RagChatPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.disposeSections();
    this.containerEl.empty();
    const { containerEl } = this;

    renderApiKeySection(containerEl, this.plugin);
    renderRetrievalSection(containerEl, this.plugin);
    renderGenerationModel(containerEl, this.plugin);
    renderRetrievalKnobs(containerEl, this.plugin);
    renderAgentSection(containerEl, this.plugin);
    renderTtsVoiceSection(containerEl, this.plugin);
    renderTtsAudioSection(containerEl, this.plugin, this.app);
    renderMicInputSection(containerEl, this.plugin);
    this.disposeRemoteSection = renderRemoteSection(containerEl, this.plugin);
    this.disposeSecuritySection = renderSecuritySection(containerEl, this.plugin, this.app);
  }

  hide(): void {
    this.disposeSections();
    super.hide();
  }

  private disposeSections(): void {
    this.disposeRemoteSection?.();
    this.disposeRemoteSection = null;
    this.disposeSecuritySection?.();
    this.disposeSecuritySection = null;
  }
}
