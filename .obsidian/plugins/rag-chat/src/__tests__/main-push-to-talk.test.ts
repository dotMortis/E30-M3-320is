import { describe, expect, it, vi } from "vitest";
import { Notice } from "./mocks/obsidian";
import { fakeManifest } from "./fixtures/manifest";
import { makePlugin } from "./main-harness";

function keyEvent(overrides: Partial<{ ctrlKey: boolean; altKey: boolean; shiftKey: boolean; key: string }> = {}) {
  return {
    ctrlKey: true,
    altKey: true,
    shiftKey: true,
    key: "F12",
    preventDefault: vi.fn(),
    ...overrides,
  } as unknown as KeyboardEvent;
}

function setUpPlugin() {
  const manifest = fakeManifest();
  return makePlugin({
    loadData: {},
    adapterFiles: { ".obsidian/plugins/rag-chat/rag-manifest.json": JSON.stringify(manifest) },
  });
}

describe("RagChatPlugin push-to-talk hotkey (Ctrl+Alt+Shift+F12)", () => {
  it("shows a notice and does nothing on keydown when no chat view is open", async () => {
    const { plugin } = setUpPlugin();
    await plugin.onload();

    (plugin as any).handlePushToTalkKeyDown(keyEvent());

    expect(Notice.instances.some((n) => n.message.includes("Bitte zuerst die Chat-Ansicht öffnen"))).toBe(true);
  });

  it("ignores keydown events that don't match the full Ctrl+Alt+Shift+F12 combo", async () => {
    const { plugin } = setUpPlugin();
    await plugin.onload();

    (plugin as any).handlePushToTalkKeyDown(keyEvent({ shiftKey: false }));
    (plugin as any).handlePushToTalkKeyDown(keyEvent({ key: "F11" }));

    expect(Notice.instances).toHaveLength(0);
  });

  it("starts voice recording on the open chat view on keydown, and stops+sends on keyup", async () => {
    const { plugin, app } = setUpPlugin();
    await plugin.onload();

    const { RagChatView, RAG_CHAT_VIEW_TYPE } = await import("../view/view");
    const startVoiceRecording = vi.fn();
    const stopVoiceRecordingAndSend = vi.fn().mockResolvedValue(undefined);
    const fakeView = Object.create(RagChatView.prototype);
    fakeView.startVoiceRecording = startVoiceRecording;
    fakeView.stopVoiceRecordingAndSend = stopVoiceRecordingAndSend;
    (app.workspace as any).leaves.push({ viewType: RAG_CHAT_VIEW_TYPE, view: fakeView });

    (plugin as any).handlePushToTalkKeyDown(keyEvent());
    expect(startVoiceRecording).toHaveBeenCalledTimes(1);

    (plugin as any).handlePushToTalkKeyUp(keyEvent());
    expect(stopVoiceRecordingAndSend).toHaveBeenCalledTimes(1);
  });

  it("does not start a second recording on a repeated keydown before the key is released", async () => {
    const { plugin, app } = setUpPlugin();
    await plugin.onload();

    const { RagChatView, RAG_CHAT_VIEW_TYPE } = await import("../view/view");
    const startVoiceRecording = vi.fn();
    const fakeView = Object.create(RagChatView.prototype);
    fakeView.startVoiceRecording = startVoiceRecording;
    fakeView.stopVoiceRecordingAndSend = vi.fn().mockResolvedValue(undefined);
    (app.workspace as any).leaves.push({ viewType: RAG_CHAT_VIEW_TYPE, view: fakeView });

    (plugin as any).handlePushToTalkKeyDown(keyEvent());
    (plugin as any).handlePushToTalkKeyDown(keyEvent());

    expect(startVoiceRecording).toHaveBeenCalledTimes(1);
  });

  it("ignores keyup events for unrelated keys", async () => {
    const { plugin, app } = setUpPlugin();
    await plugin.onload();

    const { RagChatView, RAG_CHAT_VIEW_TYPE } = await import("../view/view");
    const stopVoiceRecordingAndSend = vi.fn().mockResolvedValue(undefined);
    const fakeView = Object.create(RagChatView.prototype);
    fakeView.startVoiceRecording = vi.fn();
    fakeView.stopVoiceRecordingAndSend = stopVoiceRecordingAndSend;
    (app.workspace as any).leaves.push({ viewType: RAG_CHAT_VIEW_TYPE, view: fakeView });

    (plugin as any).handlePushToTalkKeyDown(keyEvent());
    (plugin as any).handlePushToTalkKeyUp(keyEvent({ key: "Shift" }));

    expect(stopVoiceRecordingAndSend).not.toHaveBeenCalled();
  });

  it("does not throw on load/unload in environments without a window global (e.g. this test runner)", async () => {
    const { plugin } = setUpPlugin();
    await expect(plugin.onload()).resolves.toBeUndefined();
    expect(() => plugin.onunload()).not.toThrow();
  });
});
