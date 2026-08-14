import type RagChatPlugin from "../main";

export async function recordCharsUsed(plugin: RagChatPlugin, charCount: number): Promise<void> {
  plugin.settings.ttsCharCount += charCount;
  await plugin.saveSettings();
}
