import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Notice, Platform } from "./mocks/obsidian";
import { fakeManifest } from "./fixtures/manifest";
import { makePlugin } from "./main-harness";

interface CapturedClient {
  callbacks: {
    onPress: () => void;
    onRelease: () => void;
    onStatusChange: (status: string, detail?: string) => void;
  };
  getPortOverride: () => string;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  getStatus: ReturnType<typeof vi.fn>;
}

let captured: CapturedClient[] = [];

vi.mock("../remote/bridge-client", () => ({
  RemoteBridgeClient: vi.fn().mockImplementation(function (
    _pluginDirFullPath: string,
    callbacks: CapturedClient["callbacks"],
    getPortOverride: () => string,
  ) {
    const instance: CapturedClient = {
      callbacks,
      getPortOverride,
      start: vi.fn(),
      stop: vi.fn(),
      getStatus: vi.fn().mockReturnValue("connected"),
    };
    captured.push(instance);
    return instance;
  }),
}));

function setUpPlugin(loadData: Record<string, unknown> = {}) {
  const manifest = fakeManifest();
  return makePlugin({
    loadData,
    adapterFiles: { ".obsidian/plugins/rag-chat/rag-manifest.json": JSON.stringify(manifest) },
  });
}

describe("RagChatPlugin hardware voice remote", () => {
  beforeEach(() => {
    captured = [];
    Platform.isDesktopApp = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not construct a bridge client when remoteEnabled is false (default)", async () => {
    const { plugin } = setUpPlugin({});
    await plugin.onload();
    expect(captured).toHaveLength(0);
  });

  it("constructs and starts a bridge client on load when remoteEnabled is true", async () => {
    const { plugin } = setUpPlugin({ remoteEnabled: true });
    await plugin.onload();
    expect(captured).toHaveLength(1);
    expect(captured[0].start).toHaveBeenCalledTimes(1);
  });

  it("does not construct a bridge client on mobile even when remoteEnabled is true", async () => {
    Platform.isDesktopApp = false;
    const { plugin } = setUpPlugin({ remoteEnabled: true });
    await plugin.onload();
    expect(captured).toHaveLength(0);
  });

  it("refreshRemoteBridge() tears down the previous client before creating a new one", async () => {
    const { plugin } = setUpPlugin({ remoteEnabled: true });
    await plugin.onload();
    const first = captured[0];

    plugin.refreshRemoteBridge();

    expect(first.stop).toHaveBeenCalledTimes(1);
    expect(captured).toHaveLength(2);
    expect(captured[1].start).toHaveBeenCalledTimes(1);
  });

  it("passes the live settings.remoteSerialPortOverride through to the client", async () => {
    const { plugin } = setUpPlugin({ remoteEnabled: true, remoteSerialPortOverride: "/dev/ttyACM3" });
    await plugin.onload();
    expect(captured[0].getPortOverride()).toBe("/dev/ttyACM3");
  });

  it("getRemoteStatus() reflects the client's status, and null when disabled", async () => {
    const { plugin } = setUpPlugin({ remoteEnabled: true });
    await plugin.onload();
    expect(plugin.getRemoteStatus()).toBe("connected");

    plugin.settings.remoteEnabled = false;
    plugin.refreshRemoteBridge();
    expect(plugin.getRemoteStatus()).toBeNull();
  });

  it("onunload stops the bridge client", async () => {
    const { plugin } = setUpPlugin({ remoteEnabled: true });
    await plugin.onload();
    plugin.onunload();
    expect(captured[0].stop).toHaveBeenCalledTimes(1);
  });

  async function setUpWithView() {
    const { plugin, app } = setUpPlugin({ remoteEnabled: true });
    await plugin.onload();
    const { RagChatView, RAG_CHAT_VIEW_TYPE } = await import("../view/view");
    const startVoiceRecording = vi.fn();
    const stopVoiceRecordingAndSend = vi.fn().mockResolvedValue(undefined);
    const setRemoteStatus = vi.fn();
    const pulseRemoteIndicator = vi.fn();
    const fakeView = Object.create(RagChatView.prototype);
    fakeView.startVoiceRecording = startVoiceRecording;
    fakeView.stopVoiceRecordingAndSend = stopVoiceRecordingAndSend;
    fakeView.setRemoteStatus = setRemoteStatus;
    fakeView.pulseRemoteIndicator = pulseRemoteIndicator;
    (app.workspace as any).leaves.push({ viewType: RAG_CHAT_VIEW_TYPE, view: fakeView });
    return {
      plugin,
      client: captured[0],
      startVoiceRecording,
      stopVoiceRecordingAndSend,
      setRemoteStatus,
      pulseRemoteIndicator,
    };
  }

  it("onPress opens/reveals the chat view, starts recording, and pulses the indicator", async () => {
    const { client, startVoiceRecording, pulseRemoteIndicator } = await setUpWithView();

    client.callbacks.onPress();
    await Promise.resolve();

    expect(startVoiceRecording).toHaveBeenCalledTimes(1);
    expect(pulseRemoteIndicator).toHaveBeenCalledTimes(1);
  });

  it("onRelease stops+sends the recording and pulses the indicator", async () => {
    const { client, stopVoiceRecordingAndSend, pulseRemoteIndicator } = await setUpWithView();

    client.callbacks.onRelease();

    expect(stopVoiceRecordingAndSend).toHaveBeenCalledTimes(1);
    expect(pulseRemoteIndicator).toHaveBeenCalledTimes(1);
  });

  it("onRelease clears the pending safety timer so it never fires afterwards", async () => {
    vi.useFakeTimers();
    const { client, stopVoiceRecordingAndSend } = await setUpWithView();

    client.callbacks.onPress();
    await Promise.resolve();
    client.callbacks.onRelease();
    stopVoiceRecordingAndSend.mockClear();

    vi.advanceTimersByTime(60_000);

    expect(stopVoiceRecordingAndSend).not.toHaveBeenCalled();
    expect(Notice.instances.some((n) => n.message.includes("automatisch beendet"))).toBe(false);
  });

  it("auto-stops the recording and shows a Notice after 30s if no release signal ever arrives", async () => {
    vi.useFakeTimers();
    const { client, stopVoiceRecordingAndSend } = await setUpWithView();

    client.callbacks.onPress();
    await Promise.resolve();

    vi.advanceTimersByTime(29_999);
    expect(stopVoiceRecordingAndSend).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(stopVoiceRecordingAndSend).toHaveBeenCalledTimes(1);
    expect(Notice.instances.some((n) => n.message.includes("automatisch beendet"))).toBe(true);
  });

  it("broadcasts status changes to every open RagChatView leaf", async () => {
    const { client, setRemoteStatus } = await setUpWithView();
    setRemoteStatus.mockClear();

    client.callbacks.onStatusChange("disconnected");

    expect(setRemoteStatus).toHaveBeenCalledWith("disconnected");
  });
});
