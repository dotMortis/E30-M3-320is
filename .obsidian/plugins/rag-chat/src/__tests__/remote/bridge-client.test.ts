import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const spawnMock = vi.fn();
const existsSyncMock = vi.fn();
const chmodSyncMock = vi.fn();

vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));
vi.mock("node:fs", () => ({
  existsSync: (...args: unknown[]) => existsSyncMock(...args),
  chmodSync: (...args: unknown[]) => chmodSyncMock(...args),
}));

class FakeChild extends EventEmitter {
  stdout = new EventEmitter();
  kill = vi.fn();
}

function setPlatformArch(platform: string, arch: string): void {
  Object.defineProperty(process, "platform", { value: platform, configurable: true });
  Object.defineProperty(process, "arch", { value: arch, configurable: true });
}

describe("RemoteBridgeClient", () => {
  const originalPlatform = process.platform;
  const originalArch = process.arch;
  let RemoteBridgeClient: typeof import("../../remote/bridge-client").RemoteBridgeClient;

  beforeEach(async () => {
    vi.resetModules();
    spawnMock.mockReset();
    existsSyncMock.mockReset();
    chmodSyncMock.mockReset();
    existsSyncMock.mockReturnValue(true);
    setPlatformArch("linux", "x64");
    ({ RemoteBridgeClient } = await import("../../remote/bridge-client"));
  });

  afterEach(() => {
    vi.useRealTimers();
    setPlatformArch(originalPlatform, originalArch);
  });

  function makeCallbacks() {
    return {
      onPress: vi.fn(),
      onRelease: vi.fn(),
      onStatusChange: vi.fn(),
    };
  }

  it("reports 'unsupported' without spawning on an unsupported platform/arch", () => {
    setPlatformArch("darwin", "arm64");
    const callbacks = makeCallbacks();
    const client = new RemoteBridgeClient("/plugin/dir", callbacks, () => "");

    client.start();

    expect(spawnMock).not.toHaveBeenCalled();
    expect(client.getStatus()).toBe("unsupported");
    expect(callbacks.onStatusChange).toHaveBeenCalledWith("unsupported", expect.any(String));
  });

  it("reports 'unsupported' when the platform binary is missing", () => {
    existsSyncMock.mockReturnValue(false);
    const callbacks = makeCallbacks();
    const client = new RemoteBridgeClient("/plugin/dir", callbacks, () => "");

    client.start();

    expect(spawnMock).not.toHaveBeenCalled();
    expect(client.getStatus()).toBe("unsupported");
  });

  it("spawns the linux-x64 binary, chmods it, and passes no -port arg when no override is set", () => {
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const callbacks = makeCallbacks();
    const client = new RemoteBridgeClient("/plugin/dir", callbacks, () => "");

    client.start();

    expect(chmodSyncMock).toHaveBeenCalledWith("/plugin/dir/bin/serial-bridge-linux-x64", 0o755);
    expect(spawnMock).toHaveBeenCalledWith(
      "/plugin/dir/bin/serial-bridge-linux-x64",
      [],
      expect.objectContaining({ stdio: ["pipe", "pipe", "pipe"] }),
    );
    expect(client.getStatus()).toBe("starting");
  });

  it("passes a -port=<override> arg when a manual port override is set", () => {
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const client = new RemoteBridgeClient("/plugin/dir", makeCallbacks(), () => "/dev/ttyACM0");

    client.start();

    expect(spawnMock).toHaveBeenCalledWith(
      "/plugin/dir/bin/serial-bridge-linux-x64",
      ["-port=/dev/ttyACM0"],
      expect.anything(),
    );
  });

  it("does not chmod on win32 and spawns the .exe binary", () => {
    setPlatformArch("win32", "x64");
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const client = new RemoteBridgeClient("C:\\vault\\plugin", makeCallbacks(), () => "");

    client.start();

    expect(chmodSyncMock).not.toHaveBeenCalled();
    expect(spawnMock).toHaveBeenCalledWith(
      "C:\\vault\\plugin/bin/serial-bridge-win32-x64.exe",
      [],
      expect.anything(),
    );
  });

  it("parses a 'press' line from stdout and invokes onPress", () => {
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const callbacks = makeCallbacks();
    new RemoteBridgeClient("/plugin/dir", callbacks, () => "").start();

    fakeChild.stdout.emit("data", Buffer.from('{"type":"press"}\n'));

    expect(callbacks.onPress).toHaveBeenCalledTimes(1);
  });

  it("parses a 'release' line from stdout and invokes onRelease", () => {
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const callbacks = makeCallbacks();
    new RemoteBridgeClient("/plugin/dir", callbacks, () => "").start();

    fakeChild.stdout.emit("data", Buffer.from('{"type":"release"}\n'));

    expect(callbacks.onRelease).toHaveBeenCalledTimes(1);
  });

  it("handles multiple events split across chunks and buffers a partial trailing line", () => {
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const callbacks = makeCallbacks();
    new RemoteBridgeClient("/plugin/dir", callbacks, () => "").start();

    fakeChild.stdout.emit("data", Buffer.from('{"type":"press"}\n{"type":"rel'));
    expect(callbacks.onPress).toHaveBeenCalledTimes(1);
    expect(callbacks.onRelease).not.toHaveBeenCalled();

    fakeChild.stdout.emit("data", Buffer.from('ease"}\n'));
    expect(callbacks.onRelease).toHaveBeenCalledTimes(1);
  });

  it("ignores malformed JSON lines without throwing", () => {
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const callbacks = makeCallbacks();
    new RemoteBridgeClient("/plugin/dir", callbacks, () => "").start();

    expect(() => fakeChild.stdout.emit("data", Buffer.from("not json at all\n"))).not.toThrow();
    expect(callbacks.onPress).not.toHaveBeenCalled();
    expect(callbacks.onRelease).not.toHaveBeenCalled();
  });

  it("reports 'connected' with the port on a status event, and 'disconnected' when connected becomes false", () => {
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const callbacks = makeCallbacks();
    const client = new RemoteBridgeClient("/plugin/dir", callbacks, () => "");
    client.start();

    fakeChild.stdout.emit("data", Buffer.from('{"type":"status","connected":true,"port":"/dev/ttyACM0"}\n'));
    expect(client.getStatus()).toBe("connected");
    expect(callbacks.onStatusChange).toHaveBeenCalledWith("connected", "/dev/ttyACM0");

    fakeChild.stdout.emit("data", Buffer.from('{"type":"status","connected":false}\n'));
    expect(client.getStatus()).toBe("disconnected");
  });

  it("reports 'error' status on an error event with the message as detail", () => {
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const callbacks = makeCallbacks();
    new RemoteBridgeClient("/plugin/dir", callbacks, () => "").start();

    fakeChild.stdout.emit("data", Buffer.from('{"type":"error","message":"ERR replay-rejected"}\n'));

    expect(callbacks.onStatusChange).toHaveBeenCalledWith("error", "ERR replay-rejected");
  });

  it("restarts the process with backoff after an unexpected exit, and resets backoff once a line is parsed", () => {
    vi.useFakeTimers();
    const firstChild = new FakeChild();
    const secondChild = new FakeChild();
    spawnMock.mockReturnValueOnce(firstChild).mockReturnValueOnce(secondChild);
    const callbacks = makeCallbacks();
    new RemoteBridgeClient("/plugin/dir", callbacks, () => "").start();

    expect(spawnMock).toHaveBeenCalledTimes(1);
    firstChild.emit("exit", 1, null);
    expect(callbacks.onStatusChange).toHaveBeenCalledWith("disconnected", undefined);

    vi.advanceTimersByTime(999);
    expect(spawnMock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(spawnMock).toHaveBeenCalledTimes(2);
  });

  it("does not restart after stop() is called", () => {
    vi.useFakeTimers();
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const client = new RemoteBridgeClient("/plugin/dir", makeCallbacks(), () => "");
    client.start();

    client.stop();
    fakeChild.emit("exit", 1, null);
    vi.advanceTimersByTime(60_000);

    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(fakeChild.kill).toHaveBeenCalledTimes(1);
  });
});
