import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const spawnMock = vi.fn();
const existsSyncMock = vi.fn();
const chmodSyncMock = vi.fn();

/** Mirrors RESTART_MAX_DELAY_MS in ../../remote/bridge-client.ts. */
const RESTART_MAX_DELAY_MS = 30_000;

vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));
vi.mock("node:fs", () => ({
  existsSync: (...args: unknown[]) => existsSyncMock(...args),
  chmodSync: (...args: unknown[]) => chmodSyncMock(...args),
}));

class FakeChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
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
      onWarning: vi.fn(),
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
      expect.objectContaining({ stdio: ["pipe", "pipe", "pipe"], windowsHide: true }),
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

  it("keeps a disconnect reason as the status detail instead of promoting it to an error", () => {
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const callbacks = makeCallbacks();
    const client = new RemoteBridgeClient("/plugin/dir", callbacks, () => "");
    client.start();

    fakeChild.stdout.emit(
      "data",
      Buffer.from('{"type":"status","connected":false,"message":"Kein Empfänger gefunden."}\n'),
    );

    // "No receiver attached" is the most ordinary state there is - it must read
    // as a plain disconnect with a reason, not as an error.
    expect(client.getStatus()).toBe("disconnected");
    expect(client.getStatusDetail()).toBe("Kein Empfänger gefunden.");
    expect(callbacks.onStatusChange).toHaveBeenCalledWith("disconnected", "Kein Empfänger gefunden.");
  });

  it("reports 'error' status on an error event with the message as detail", () => {
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const callbacks = makeCallbacks();
    const client = new RemoteBridgeClient("/plugin/dir", callbacks, () => "");
    client.start();

    fakeChild.stdout.emit("data", Buffer.from('{"type":"error","message":"/dev/ttyACM0: permission denied"}\n'));

    expect(callbacks.onStatusChange).toHaveBeenCalledWith("error", "/dev/ttyACM0: permission denied");
    expect(client.getStatusDetail()).toBe("/dev/ttyACM0: permission denied");
  });

  it("routes a device-level 'warning' event to onWarning without touching the link status", () => {
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const callbacks = makeCallbacks();
    const client = new RemoteBridgeClient("/plugin/dir", callbacks, () => "");
    client.start();

    fakeChild.stdout.emit("data", Buffer.from('{"type":"status","connected":true,"port":"/dev/ttyACM0"}\n'));
    callbacks.onStatusChange.mockClear();
    // Receiving an ERR line proves the USB link works, so it must never latch
    // the indicator into an error state.
    fakeChild.stdout.emit("data", Buffer.from('{"type":"warning","message":"ERR stale-epoch-repair-needed"}\n'));

    expect(callbacks.onWarning).toHaveBeenCalledWith("ERR stale-epoch-repair-needed");
    expect(callbacks.onStatusChange).not.toHaveBeenCalled();
    expect(client.getStatus()).toBe("connected");
  });

  it("restarts the process with backoff after an unexpected exit, and resets backoff once a line is parsed", () => {
    vi.useFakeTimers();
    const children = [new FakeChild(), new FakeChild(), new FakeChild()];
    spawnMock.mockImplementation(() => children.shift() ?? new FakeChild());
    const callbacks = makeCallbacks();
    const first = children[0];
    new RemoteBridgeClient("/plugin/dir", callbacks, () => "").start();

    expect(spawnMock).toHaveBeenCalledTimes(1);
    first.emit("exit", 1, null);
    expect(callbacks.onStatusChange).toHaveBeenCalledWith("disconnected", undefined);

    vi.advanceTimersByTime(999);
    expect(spawnMock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(spawnMock).toHaveBeenCalledTimes(2);

    // Second child exits too: without a parsed line in between, the backoff
    // must have doubled to 2s.
    const second = spawnMock.mock.results[1].value as FakeChild;
    second.emit("exit", 1, null);
    vi.advanceTimersByTime(1999);
    expect(spawnMock).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(spawnMock).toHaveBeenCalledTimes(3);

    // A well-formed line proves the child works, so the next crash must go
    // back to the 1s base delay.
    const third = spawnMock.mock.results[2].value as FakeChild;
    third.stdout.emit("data", Buffer.from('{"type":"status","connected":true,"port":"/dev/ttyACM0"}\n'));
    third.emit("exit", 1, null);
    vi.advanceTimersByTime(1000);
    expect(spawnMock).toHaveBeenCalledTimes(4);
  });

  it("schedules only one restart when both 'error' and 'exit' fire for the same child", () => {
    vi.useFakeTimers();
    spawnMock.mockImplementation(() => new FakeChild());
    new RemoteBridgeClient("/plugin/dir", makeCallbacks(), () => "").start();
    const child = spawnMock.mock.results[0].value as FakeChild;

    // Node can emit both for one child; two timers would mean two supervised
    // processes fighting over the same serial port.
    child.emit("error", new Error("EPIPE"));
    child.emit("exit", 1, null);
    vi.advanceTimersByTime(60_000);

    expect(spawnMock).toHaveBeenCalledTimes(2);
  });

  it("kills a still-running child before spawning a replacement", () => {
    vi.useFakeTimers();
    spawnMock.mockImplementation(() => new FakeChild());
    new RemoteBridgeClient("/plugin/dir", makeCallbacks(), () => "").start();
    const child = spawnMock.mock.results[0].value as FakeChild;

    // 'error' alone (no exit) leaves the process alive as far as we know.
    child.emit("error", new Error("boom"));
    vi.advanceTimersByTime(1000);

    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(child.kill).toHaveBeenCalledTimes(1);
  });

  it("drains stderr so a chatty bridge cannot fill its pipe buffer and stall", () => {
    const fakeChild = new FakeChild();
    spawnMock.mockReturnValue(fakeChild);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    new RemoteBridgeClient("/plugin/dir", makeCallbacks(), () => "").start();

    expect(fakeChild.stderr.listenerCount("data")).toBe(1);
    fakeChild.stderr.emit("data", Buffer.from("panic: something went wrong\n"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("panic: something went wrong"));
    errorSpy.mockRestore();
  });

  it("resets the restart backoff on a fresh start() after a crash loop", () => {
    vi.useFakeTimers();
    spawnMock.mockImplementation(() => new FakeChild());
    const client = new RemoteBridgeClient("/plugin/dir", makeCallbacks(), () => "");
    client.start();

    for (let i = 0; i < 3; i++) {
      (spawnMock.mock.results[i].value as FakeChild).emit("exit", 1, null);
      vi.advanceTimersByTime(RESTART_MAX_DELAY_MS);
    }
    const spawnsBefore = spawnMock.mock.calls.length;

    client.stop();
    client.start();
    (spawnMock.mock.results[spawnsBefore].value as FakeChild).emit("exit", 1, null);
    vi.advanceTimersByTime(1000);

    expect(spawnMock).toHaveBeenCalledTimes(spawnsBefore + 2);
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
