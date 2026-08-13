import { DEFAULT_SETTINGS, type RagChatSettings } from "../../settings/types";

export function fakeSettings(overrides: Partial<RagChatSettings> = {}): RagChatSettings {
  return { ...DEFAULT_SETTINGS, geminiApiKey: "test-api-key", ...overrides };
}
