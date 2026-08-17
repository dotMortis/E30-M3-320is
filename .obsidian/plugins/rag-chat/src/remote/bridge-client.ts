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
}

interface BridgeEvent {
  type?: string;
  connected?: boolean;
  port?: string;
  message?: string;
}

const RESTART_BASE_DELAY_MS = 1000;
const RESTART_MAX_DELAY_MS = 30_000;

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

  constructor(
    private readonly pluginDirFullPath: string,
    private readonly callbacks: RemoteBridgeCallbacks,
    private readonly getPortOverride: () => string,
  ) {}

  start(): void {
    this.stopped = false;
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
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.child?.kill();
    this.child = null;
  }

  getStatus(): RemoteBridgeStatus {
    return this.status;
  }

  private spawnProcess(binaryPath: string): void {
    this.setStatus("starting");
    const override = this.getPortOverride();
    const args = override ? [`-port=${override}`] : [];

    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawn(binaryPath, args, { stdio: ["pipe", "pipe", "pipe"] });
    } catch (err) {
      this.setStatus("error", err instanceof Error ? err.message : String(err));
      this.scheduleRestart(binaryPath);
      return;
    }
    this.child = child;
    this.stdoutBuffer = "";

    child.stdout.on("data", (chunk: Buffer) => this.handleStdout(chunk));
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
    const delay = Math.min(RESTART_BASE_DELAY_MS * 2 ** this.restartAttempt, RESTART_MAX_DELAY_MS);
    this.restartAttempt++;
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (this.stopped) return;
      this.spawnProcess(binaryPath);
    }, delay);
  }

  private handleStdout(chunk: Buffer): void {
    this.stdoutBuffer += chunk.toString("utf8");
    let idx: number;
    while ((idx = this.stdoutBuffer.indexOf("\n")) >= 0) {
      const line = this.stdoutBuffer.slice(0, idx).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(idx + 1);
      if (line) this.handleLine(line);
    }
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
        this.setStatus(ev.connected ? "connected" : "disconnected", ev.port);
        break;
      case "error":
        this.setStatus("error", ev.message);
        break;
      default:
        break;
    }
  }

  private setStatus(status: RemoteBridgeStatus, detail?: string): void {
    this.status = status;
    this.callbacks.onStatusChange(status, detail);
  }
}
