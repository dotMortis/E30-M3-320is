import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Status of the voice-remote serial bridge child process (see
 * hardware/voice-remote/PLAN.md). This is a process/link status, not a
 * feature-enabled flag - callers that only construct a RemoteBridgeClient
 * when the feature is enabled in settings should treat "no client instance"
 * as the "disabled" case (see main.ts's refreshRemoteBridge).
 */
export type RemoteBridgeStatus = "starting" | "connected" | "disconnected" | "error" | "unsupported";

export interface RemoteBridgeCallbacks {
  onPress: () => void;
  onRelease: () => void;
  onStatusChange: (status: RemoteBridgeStatus, detail?: string) => void;
  /**
   * Device-level complaint forwarded from the receiver (an `ERR ...` serial
   * line, e.g. "ERR stale-epoch-repair-needed"). Deliberately separate from
   * onStatusChange: receiving such a line proves the USB link works, so it
   * must never latch the link status into "error" - which it would, since
   * status is only re-emitted on connect/disconnect (see
   * hardware/voice-remote/PLAN.md's serial-protocol section).
   */
  onWarning?: (message: string) => void;
}

interface BridgeEvent {
  type?: string;
  connected?: boolean;
  port?: string;
  message?: string;
}

const RESTART_BASE_DELAY_MS = 1000;
const RESTART_MAX_DELAY_MS = 30_000;

/**
 * Hard cap on the unparsed stdout tail we are willing to buffer. The bridge
 * only ever emits short newline-terminated JSON objects, so anything larger
 * means we are not talking to our bridge (or it went haywire) - dropping the
 * buffer is better than growing it without bound for the lifetime of the app.
 */
const MAX_STDOUT_BUFFER_BYTES = 64 * 1024;

function binaryNameFor(platform: string, arch: string): string | null {
  if (platform === "win32" && arch === "x64") return "serial-bridge-win32-x64.exe";
  if (platform === "linux" && arch === "x64") return "serial-bridge-linux-x64";
  return null;
}

/**
 * Spawns and supervises the prebuilt Go serial-bridge binary
 * (.obsidian/plugins/rag-chat/bin/serial-bridge-*), parses its
 * newline-delimited JSON stdout, and surfaces press/release/status events.
 *
 * Deliberately platform-detected rather than bundled as a Node native
 * module: this way the plugin never depends on Obsidian's bundled Electron
 * ABI for serial access (see PLAN.md "Serial bridge approach").
 */
export class RemoteBridgeClient {
  private child: ChildProcessWithoutNullStreams | null = null;
  private stdoutBuffer = "";
  private restartAttempt = 0;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = true;
  private status: RemoteBridgeStatus = "starting";
  private statusDetail: string | undefined;

  constructor(
    private readonly pluginDirFullPath: string,
    private readonly callbacks: RemoteBridgeCallbacks,
    private readonly getPortOverride: () => string,
  ) {}

  start(): void {
    this.stopped = false;
    // A fresh start is not a continuation of an earlier crash loop - otherwise
    // re-enabling the feature after a bad run would inherit a 30s backoff.
    this.restartAttempt = 0;
    const binaryName = binaryNameFor(process.platform, process.arch);
    if (!binaryName) {
      this.setStatus("unsupported", `Nicht unterstützte Plattform: ${process.platform}/${process.arch}`);
      return;
    }
    const binaryPath = join(this.pluginDirFullPath, "bin", binaryName);
    if (!existsSync(binaryPath)) {
      this.setStatus("unsupported", `Bridge-Programm fehlt: ${binaryPath}`);
      return;
    }
    if (process.platform !== "win32") {
      try {
        chmodSync(binaryPath, 0o755);
      } catch {
        // Best-effort - if this fails, spawn() below will surface a clear error anyway.
      }
    }
    this.spawnProcess(binaryPath);
  }

  stop(): void {
    this.stopped = true;
    this.clearRestartTimer();
    this.child?.kill();
    this.child = null;
    this.stdoutBuffer = "";
  }

  getStatus(): RemoteBridgeStatus {
    return this.status;
  }

  /** Last detail that came with a status change (error text, port name, ...). */
  getStatusDetail(): string | undefined {
    return this.statusDetail;
  }

  private spawnProcess(binaryPath: string): void {
    // Never leave a previous child running: two bridges reading the same tty
    // would split/duplicate press events between them (Linux happily allows
    // opening the same serial device twice).
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
    this.setStatus("starting");
    const override = this.getPortOverride();
    const args = override ? [`-port=${override}`] : [];

    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawn(binaryPath, args, {
        stdio: ["pipe", "pipe", "pipe"],
        // Without this, spawning a console binary from Obsidian on Windows
        // flashes a console window on every (re)start.
        windowsHide: true,
      });
    } catch (err) {
      this.setStatus("error", err instanceof Error ? err.message : String(err));
      this.scheduleRestart(binaryPath);
      return;
    }
    this.child = child;
    this.stdoutBuffer = "";

    child.stdout.on("data", (chunk: Buffer) => this.handleStdout(chunk));
    // stderr must be consumed even if we only log it: an unread pipe fills up
    // (~64 KB) and would block the child forever.
    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8").trim();
      if (text) console.error(`RAG Chat: Fernbedienung-Bridge (stderr): ${text}`);
    });
    child.on("error", (err) => {
      this.setStatus("error", err.message);
      this.scheduleRestart(binaryPath);
    });
    child.on("exit", () => {
      if (this.child === child) this.child = null;
      if (this.stopped) return;
      this.setStatus("disconnected");
      this.scheduleRestart(binaryPath);
    });
  }

  private scheduleRestart(binaryPath: string): void {
    if (this.stopped) return;
    // Both 'error' and 'exit' can fire for the same child. Without this guard
    // each would arm its own timer, the second overwriting (but not
    // cancelling) the first, and we would end up supervising two processes.
    if (this.restartTimer) return;
    const delay = Math.min(RESTART_BASE_DELAY_MS * 2 ** this.restartAttempt, RESTART_MAX_DELAY_MS);
    this.restartAttempt++;
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (this.stopped) return;
      this.spawnProcess(binaryPath);
    }, delay);
  }

  private clearRestartTimer(): void {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
  }

  private handleStdout(chunk: Buffer): void {
    this.stdoutBuffer += chunk.toString("utf8");
    let idx: number;
    while ((idx = this.stdoutBuffer.indexOf("\n")) >= 0) {
      const line = this.stdoutBuffer.slice(0, idx).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(idx + 1);
      if (line) this.handleLine(line);
    }
    if (this.stdoutBuffer.length > MAX_STDOUT_BUFFER_BYTES) this.stdoutBuffer = "";
  }

  private handleLine(line: string): void {
    let ev: BridgeEvent;
    try {
      ev = JSON.parse(line) as BridgeEvent;
    } catch {
      return;
    }
    // Any well-formed event proves the child process itself is alive and
    // functioning, independent of USB link state - reset the crash backoff.
    this.restartAttempt = 0;

    switch (ev.type) {
      case "press":
        this.callbacks.onPress();
        break;
      case "release":
        this.callbacks.onRelease();
        break;
      case "status":
        // A disconnect carries the concrete reason in `message` (no receiver
        // attached, port not openable, permission denied); a connect carries
        // the port it settled on. Either way that string is the only
        // diagnosis the user ever gets, so keep it as the status detail.
        this.setStatus(ev.connected ? "connected" : "disconnected", ev.port ?? ev.message);
        break;
      case "error":
        this.setStatus("error", ev.message);
        break;
      case "warning":
        this.callbacks.onWarning?.(ev.message ?? "");
        break;
      default:
        break;
    }
  }

  private setStatus(status: RemoteBridgeStatus, detail?: string): void {
    this.status = status;
    this.statusDetail = detail;
    this.callbacks.onStatusChange(status, detail);
  }
}
