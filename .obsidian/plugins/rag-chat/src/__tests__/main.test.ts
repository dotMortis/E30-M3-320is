import { beforeEach, describe, expect, it, vi } from "vitest";
import { Notice, resetObsidianMocks, type Plugin as MockPlugin } from "./mocks/obsidian";
import { createFakeApp, FakeFileSystemAdapter } from "./mocks/fake-app";
import { fakeManifest } from "./fixtures/manifest";
import { encryptSecret } from "../secure-storage";

vi.mock("obsidian", async () => {
  const mock = await import("./mocks/obsidian");
  return mock;
});

let RagChatPlugin: typeof import("../main").default;

beforeEach(async () => {
  resetObsidianMocks();
  ({ default: RagChatPlugin } = await import("../main"));
});

function makePlugin(opts: { adapterFiles?: Record<string, string>; loadData?: unknown } = {}) {
  const app = createFakeApp({ adapterFiles: opts.adapterFiles });
  const plugin = new RagChatPlugin(app as any, { id: "rag-chat", dir: ".obsidian/plugins/rag-chat" } as any);
  plugin.loadData = vi.fn().mockResolvedValue(opts.loadData ?? {});
  plugin.saveData = vi.fn().mockResolvedValue(undefined);
  return { plugin, app };
}

describe("RagChatPlugin.loadSettings", () => {
  it("merges DEFAULT_SETTINGS with the persisted data", async () => {
    const { plugin } = makePlugin({ loadData: { topK: 12 } });
    await plugin.loadSettings();
    expect(plugin.settings.topK).toBe(12);
    expect(plugin.settings.embeddingModel).toBe("gemini-embedding-2");
  });

  it("decrypts a persisted encrypted API key into plaintext", async () => {
    const encrypted = await encryptSecret("my-real-api-key");
    const { plugin } = makePlugin({ loadData: { geminiApiKey: encrypted } });
    await plugin.loadSettings();
    expect(plugin.settings.geminiApiKey).toBe("my-real-api-key");
  });

  it("defaults geminiApiKey to an empty string when nothing was persisted", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    expect(plugin.settings.geminiApiKey).toBe("");
  });

  it("shows a Notice and clears the key when decryption fails on a non-empty stored value", async () => {
    const { plugin } = makePlugin({ loadData: { geminiApiKey: "garbage-not-encrypted-format" } });
    await plugin.loadSettings();
    expect(plugin.settings.geminiApiKey).toBe("");
    expect(Notice.instances.some((n) => n.message.includes("konnte nicht entschlüsselt werden"))).toBe(true);
  });

  it("does not show a decryption-failure Notice when no key was ever stored", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    expect(Notice.instances).toHaveLength(0);
  });
});

describe("RagChatPlugin.saveSettings", () => {
  it("encrypts geminiApiKey before persisting, leaving other fields as plaintext", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    plugin.settings.geminiApiKey = "plaintext-key";
    plugin.settings.topK = 10;
    await plugin.saveSettings();

    const persisted = (plugin.saveData as any).mock.calls[0][0];
    expect(persisted.geminiApiKey).not.toBe("plaintext-key");
    expect(persisted.geminiApiKey.startsWith("enc:v1:")).toBe(true);
    expect(persisted.topK).toBe(10);
  });
});

describe("RagChatPlugin.getPluginDir / getPluginDirFullPath", () => {
  it("returns the manifest's vault-relative dir", () => {
    const { plugin } = makePlugin();
    expect(plugin.getPluginDir()).toBe(".obsidian/plugins/rag-chat");
  });

  it("resolves to a real filesystem path via the vault's FileSystemAdapter", () => {
    const app = createFakeApp();
    (app.vault.adapter as FakeFileSystemAdapter) = new FakeFileSystemAdapter({}, "/home/user/vault");
    const plugin = new RagChatPlugin(app as any, { id: "rag-chat", dir: ".obsidian/plugins/rag-chat" } as any);
    expect(plugin.getPluginDirFullPath()).toBe("/home/user/vault/.obsidian/plugins/rag-chat");
  });
});

describe("RagChatPlugin.getManifest", () => {
  it("reads and caches rag-manifest.json from the plugin directory", async () => {
    const manifest = fakeManifest();
    const { plugin, app } = makePlugin({
      adapterFiles: { ".obsidian/plugins/rag-chat/rag-manifest.json": JSON.stringify(manifest) },
    });
    const readSpy = vi.spyOn(app.vault.adapter, "read");

    const first = await plugin.getManifest();
    const second = await plugin.getManifest();

    expect(first).toEqual(manifest);
    expect(second).toBe(first);
    expect(readSpy).toHaveBeenCalledTimes(1);
  });

  it("propagates a read failure when rag-manifest.json is missing", async () => {
    const { plugin } = makePlugin({ adapterFiles: {} });
    await expect(plugin.getManifest()).rejects.toThrow();
  });
});

describe("RagChatPlugin.onload", () => {
  it("registers the view, ribbon icon, command, and settings tab", async () => {
    const manifest = fakeManifest();
    const { plugin } = makePlugin({
      loadData: {},
      adapterFiles: { ".obsidian/plugins/rag-chat/rag-manifest.json": JSON.stringify(manifest) },
    });
    await plugin.onload();

    const mocked = plugin as unknown as MockPlugin;
    expect(mocked.viewFactories.has("rag-chat-view")).toBe(true);
    expect(mocked.ribbonIcons).toHaveLength(1);
    expect(mocked.commands.map((c) => c.id)).toContain("rag-chat-open");
    expect(mocked.settingTabs).toHaveLength(1);
  });

  it("shows a Notice warning when the manifest mismatches settings (embedding-parity guard)", async () => {
    const manifest = fakeManifest({ embeddingModel: "some-other-model" });
    const { plugin } = makePlugin({
      loadData: {},
      adapterFiles: { ".obsidian/plugins/rag-chat/rag-manifest.json": JSON.stringify(manifest) },
    });
    await plugin.onload();
    expect(Notice.instances.some((n) => n.message.includes("some-other-model"))).toBe(true);
  });

  it("shows a Notice (does not throw) when rag-manifest.json fails to load", async () => {
    const { plugin } = makePlugin({ loadData: {}, adapterFiles: {} });
    await expect(plugin.onload()).resolves.toBeUndefined();
    expect(Notice.instances.some((n) => n.message.includes("konnte rag-manifest.json nicht laden"))).toBe(true);
  });
});
