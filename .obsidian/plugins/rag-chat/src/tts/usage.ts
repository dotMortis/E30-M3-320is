import type RagChatPlugin from "../main";

/**
 * Records characters actually sent to the Cloud TTS synthesize endpoint and
 * persists the updated cumulative counter. Must be called exactly once per
 * real synthesis API call - never on a cached replay of previously
 * synthesized audio (see ChatTurn.ttsAudioBase64).
 */
export async function recordCharsUsed(plugin: RagChatPlugin, charCount: number): Promise<void> {
  plugin.settings.ttsCharCount += charCount;
  await plugin.saveSettings();
}
