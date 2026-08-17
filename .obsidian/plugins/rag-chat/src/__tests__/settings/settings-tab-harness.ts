import { beforeEach, vi } from "vitest";
import type { FakeElement } from "../mocks/dom";
import { resetObsidianMocks } from "../mocks/obsidian";
import { fakeSettings } from "../fixtures/settings";
import type { RagChatSettings } from "../../settings/types";
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

export function makeTab(
  settingsOverrides: Partial<RagChatSettings> = {},
  opts: {
    remoteStatus?: string | null;
    remoteStatusDetail?: string;
    /** Secrets stored but still encrypted (drives the security section + hints). */
    locked?: boolean;
    /** Whether any encrypted secret exists on disk at all. */
    hasProtectedSecrets?: boolean;
  } = {},
) {
  // Listeners registered via plugin.onRemoteStatusChange(), so tests can
  // simulate the bridge changing state while the tab is open.
  const remoteStatusListeners = new Set<() => void>();
  const lockStateListeners = new Set<() => void>();
  const locked = opts.locked ?? false;
  const store = {
    isLocked: vi.fn().mockReturnValue(locked),
    isSecretLocked: vi.fn().mockReturnValue(locked),
    hasProtectedSecrets: vi.fn().mockReturnValue(opts.hasProtectedSecrets ?? locked),
    lock: vi.fn(),
    unlock: vi.fn().mockResolvedValue({ unlocked: [], failed: [] }),
    changePassword: vi.fn().mockResolvedValue(true),
    resetSecrets: vi.fn().mockResolvedValue(undefined),
    setPasswordPrompt: vi.fn(),
    onLockStateChange: vi.fn((listener: () => void) => {
      lockStateListeners.add(listener);
      return () => lockStateListeners.delete(listener);
    }),
  };
  const plugin = {
    store,
    isLocked: vi.fn().mockReturnValue(locked),
    promptUnlock: vi.fn().mockResolvedValue(true),
    settings: fakeSettings({ ttsApiKey: "tts-key", ...settingsOverrides }),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    revalidateManifest: vi.fn().mockResolvedValue(undefined),
    getRemoteStatus: vi.fn().mockReturnValue(opts.remoteStatus ?? null),
    getRemoteStatusDetail: vi.fn().mockReturnValue(opts.remoteStatusDetail),
    onRemoteStatusChange: vi.fn((listener: () => void) => {
      remoteStatusListeners.add(listener);
      return () => remoteStatusListeners.delete(listener);
    }),
    refreshRemoteBridge: vi.fn(),
  };
  const tab = new RagChatSettingTab({} as any, plugin as any);
  tab.display();
  const containerEl = tab.containerEl as unknown as FakeElement;
  const emitRemoteStatusChange = () => {
    for (const listener of remoteStatusListeners) listener();
  };
  const emitLockStateChange = () => {
    for (const listener of lockStateListeners) listener();
  };
  return {
    tab,
    plugin,
    store,
    containerEl,
    remoteStatusListeners,
    emitRemoteStatusChange,
    lockStateListeners,
    emitLockStateChange,
  };
}
