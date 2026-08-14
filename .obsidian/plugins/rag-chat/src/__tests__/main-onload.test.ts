import { describe, expect, it, vi } from "vitest";
import { Notice, type Plugin as MockPlugin } from "./mocks/obsidian";
import { createFakeApp, FakeFileSystemAdapter } from "./mocks/fake-app";
import { fakeManifest } from "./fixtures/manifest";
import { makePlugin } from "./main-harness";


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

  it("registers the reload-index command", async () => {
    const manifest = fakeManifest();
    const { plugin } = makePlugin({
      loadData: {},
      adapterFiles: { ".obsidian/plugins/rag-chat/rag-manifest.json": JSON.stringify(manifest) },
    });
    await plugin.onload();
    const mocked = plugin as unknown as MockPlugin;
    expect(mocked.commands.map((c) => c.id)).toContain("rag-chat-reload-index");
  });

  it("registers the clear-chat command", async () => {
    const manifest = fakeManifest();
    const { plugin } = makePlugin({
      loadData: {},
      adapterFiles: { ".obsidian/plugins/rag-chat/rag-manifest.json": JSON.stringify(manifest) },
    });
    await plugin.onload();
    const mocked = plugin as unknown as MockPlugin;
    expect(mocked.commands.map((c) => c.id)).toContain("rag-chat-clear");
  });

  it("the clear-chat command calls clearChat() on every open RagChatView leaf", async () => {
    const manifest = fakeManifest();
    const { plugin, app } = makePlugin({
      loadData: {},
      adapterFiles: { ".obsidian/plugins/rag-chat/rag-manifest.json": JSON.stringify(manifest) },
    });
    await plugin.onload();

    const { RagChatView } = await import("../view/view");
    const fakeView = Object.create(RagChatView.prototype);
    const clearChat = vi.fn();
    fakeView.clearChat = clearChat;
    (app.workspace as any).getLeavesOfType = () => [{ view: fakeView }];

    const mocked = plugin as unknown as MockPlugin;
    const command = mocked.commands.find((c) => c.id === "rag-chat-clear")!;
    command.callback();
    expect(clearChat).toHaveBeenCalledTimes(1);
  });
});

