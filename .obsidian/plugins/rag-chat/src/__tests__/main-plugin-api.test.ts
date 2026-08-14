import { describe, expect, it, vi } from "vitest";
import { Notice, type Plugin as MockPlugin } from "./mocks/obsidian";
import { createFakeApp, FakeFileSystemAdapter } from "./mocks/fake-app";
import { fakeManifest } from "./fixtures/manifest";
import { makePlugin, RagChatPlugin } from "./main-harness";


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

describe("RagChatPlugin.reloadIndex", () => {
  it("clears the cached manifest and reloads it from disk", async () => {
    const manifest = fakeManifest();
    const { plugin, app } = makePlugin({
      loadData: {},
      adapterFiles: { ".obsidian/plugins/rag-chat/rag-manifest.json": JSON.stringify(manifest) },
    });
    await plugin.loadSettings();
    await plugin.getManifest();
    const readSpy = vi.spyOn(app.vault.adapter, "read");

    await plugin.reloadIndex();

    expect(readSpy).toHaveBeenCalledTimes(1);
    expect(Notice.instances.some((n) => n.message.includes("Index-Cache geleert"))).toBe(true);
  });

  it("shows a Notice (does not throw) when the manifest fails to reload", async () => {
    const { plugin } = makePlugin({ loadData: {}, adapterFiles: {} });
    await expect(plugin.reloadIndex()).resolves.toBeUndefined();
    expect(Notice.instances.some((n) => n.message.includes("konnte rag-manifest.json nicht laden"))).toBe(true);
  });
});

describe("RagChatPlugin.revalidateManifest", () => {
  it("shows a Notice when the manifest mismatches current settings", async () => {
    const manifest = fakeManifest({ embeddingModel: "some-other-model" });
    const { plugin } = makePlugin({
      loadData: {},
      adapterFiles: { ".obsidian/plugins/rag-chat/rag-manifest.json": JSON.stringify(manifest) },
    });
    await plugin.loadSettings();
    await plugin.revalidateManifest();
    expect(Notice.instances.some((n) => n.message.includes("some-other-model"))).toBe(true);
  });

  it("shows no Notice when the manifest matches current settings", async () => {
    const manifest = fakeManifest();
    const { plugin } = makePlugin({
      loadData: {},
      adapterFiles: { ".obsidian/plugins/rag-chat/rag-manifest.json": JSON.stringify(manifest) },
    });
    await plugin.loadSettings();
    await plugin.revalidateManifest();
    expect(Notice.instances).toHaveLength(0);
  });
});
