import { beforeEach, vi } from "vitest";
import type { FakeElement } from "../mocks/dom";
import { resetObsidianMocks } from "../mocks/obsidian";
import { fakeSettings } from "../fixtures/settings";
import { listModelsResponse, mockRequestUrlAlways } from "../mocks/gemini-http";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

export let RagChatSettingTab: typeof import("../../settings/settings-tab").RagChatSettingTab;

beforeEach(async () => {
  resetObsidianMocks();
  mockRequestUrlAlways(listModelsResponse([]));
  RagChatSettingTab = (await import("../../settings/settings-tab")).RagChatSettingTab;
});

export function makeTab() {
  const plugin = {
    settings: fakeSettings({ ttsApiKey: "tts-key" }),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    revalidateManifest: vi.fn().mockResolvedValue(undefined),
  };
  const tab = new RagChatSettingTab({} as any, plugin as any);
  tab.display();
  const containerEl = tab.containerEl as unknown as FakeElement;
  return { tab, plugin, containerEl };
}
