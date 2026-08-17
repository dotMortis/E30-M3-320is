import { afterEach, describe, expect, it, vi } from "vitest";
import { Setting, TextComponent, ToggleComponent } from "../mocks/obsidian";
import { makeTab } from "./settings-tab-harness";

function findSettingByName(name: string) {
  return Setting.instances.find(
    (s) => s.settingEl.querySelectorAll(".setting-item-name")[0]?.text === name,
  )!;
}

describe("RagChatSettingTab.display (hardware voice remote)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the enable toggle defaulting to settings.remoteEnabled", () => {
    const { plugin } = makeTab({ remoteEnabled: true });
    const toggle = findSettingByName("Hardware-Fernbedienung aktivieren").components[0] as ToggleComponent;
    expect(toggle.value).toBe(plugin.settings.remoteEnabled);
  });

  it("persists the toggle and calls refreshRemoteBridge() on change", async () => {
    const { plugin } = makeTab();
    const toggle = findSettingByName("Hardware-Fernbedienung aktivieren").components[0] as ToggleComponent;

    await toggle.triggerChange(true);

    expect(plugin.settings.remoteEnabled).toBe(true);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
    expect(plugin.refreshRemoteBridge).toHaveBeenCalledTimes(1);
  });

  it("renders the port override field pre-filled from settings", () => {
    makeTab({ remoteSerialPortOverride: "/dev/ttyACM0" });
    const text = findSettingByName("Serieller Port (optional)").components[0] as TextComponent;
    expect(text.value).toBe("/dev/ttyACM0");
  });

  it("persists a trimmed port override and calls refreshRemoteBridge() after the debounce", async () => {
    vi.useFakeTimers();
    const { plugin } = makeTab();
    const text = findSettingByName("Serieller Port (optional)").components[0] as TextComponent;

    await text.triggerChange("  /dev/ttyACM0  ");
    expect(plugin.refreshRemoteBridge).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(600);

    expect(plugin.settings.remoteSerialPortOverride).toBe("/dev/ttyACM0");
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
    expect(plugin.refreshRemoteBridge).toHaveBeenCalledTimes(1);
  });

  it("restarts the bridge only once for a burst of keystrokes", async () => {
    vi.useFakeTimers();
    const { plugin } = makeTab();
    const text = findSettingByName("Serieller Port (optional)").components[0] as TextComponent;

    // Obsidian fires onChange per character; each apply kills and respawns the
    // bridge child process, so typing a path must not spawn a dozen of them.
    for (const value of ["/", "/d", "/de", "/dev", "/dev/ttyACM0"]) {
      await text.triggerChange(value);
      await vi.advanceTimersByTimeAsync(50);
    }
    await vi.advanceTimersByTimeAsync(600);

    expect(plugin.refreshRemoteBridge).toHaveBeenCalledTimes(1);
    expect(plugin.settings.remoteSerialPortOverride).toBe("/dev/ttyACM0");
  });

  it("does not apply a pending port override after the tab is hidden", async () => {
    vi.useFakeTimers();
    const { tab, plugin } = makeTab();
    const text = findSettingByName("Serieller Port (optional)").components[0] as TextComponent;

    await text.triggerChange("/dev/ttyACM0");
    tab.hide();
    await vi.advanceTimersByTimeAsync(600);

    expect(plugin.refreshRemoteBridge).not.toHaveBeenCalled();
  });

  it("updates the status line live when the bridge status changes", () => {
    const { plugin, containerEl, emitRemoteStatusChange } = makeTab(
      { remoteEnabled: true },
      { remoteStatus: "starting" },
    );
    const statusLine = containerEl.querySelectorAll(".rag-chat-remote-status-line")[0];
    expect(statusLine.text).toContain("Verbindungsaufbau...");

    plugin.getRemoteStatus.mockReturnValue("connected");
    emitRemoteStatusChange();

    expect(statusLine.text).toContain("Verbunden.");
  });

  it("unsubscribes from status updates once the tab is hidden", () => {
    const { tab, remoteStatusListeners } = makeTab({ remoteEnabled: true }, { remoteStatus: "starting" });
    expect(remoteStatusListeners.size).toBe(1);

    tab.hide();

    expect(remoteStatusListeners.size).toBe(0);
  });

  it("shows the status detail so an error is diagnosable without the console", () => {
    const { containerEl } = makeTab(
      { remoteEnabled: true },
      { remoteStatus: "error", remoteStatusDetail: "/dev/ttyACM0: permission denied" },
    );
    const statusLine = containerEl.querySelectorAll(".rag-chat-remote-status-line")[0];

    expect(statusLine.text).toContain("Fehler");
    expect(statusLine.text).toContain("/dev/ttyACM0: permission denied");
  });

  it("shows the concrete reason for a disconnect instead of the generic sentence", () => {
    const { containerEl } = makeTab(
      { remoteEnabled: true },
      {
        remoteStatus: "disconnected",
        remoteStatusDetail: "Kein Empfänger gefunden (kein USB-Gerät mit VID:PID 303A:1001).",
      },
    );
    const statusLine = containerEl.querySelectorAll(".rag-chat-remote-status-line")[0];

    expect(statusLine.text).toContain("Getrennt: Kein Empfänger gefunden");
    expect(statusLine.text).not.toContain("USB-Kabel nicht angeschlossen");
  });

  it("falls back to the generic disconnect sentence when there is no detail", () => {
    const { containerEl } = makeTab({ remoteEnabled: true }, { remoteStatus: "disconnected" });
    const statusLine = containerEl.querySelectorAll(".rag-chat-remote-status-line")[0];

    expect(statusLine.text).toContain("Getrennt (Empfänger nicht gefunden");
  });

  it("names the port it settled on when connected", () => {
    const { containerEl } = makeTab(
      { remoteEnabled: true },
      { remoteStatus: "connected", remoteStatusDetail: "/dev/ttyACM0" },
    );
    const statusLine = containerEl.querySelectorAll(".rag-chat-remote-status-line")[0];

    expect(statusLine.text).toContain("Verbunden (/dev/ttyACM0).");
  });

  it("shows 'Deaktiviert.' in the status line when disabled, regardless of client status", () => {
    const { containerEl } = makeTab({ remoteEnabled: false }, { remoteStatus: "connected" });
    const statusLine = containerEl.querySelectorAll(".rag-chat-remote-status-line")[0];
    expect(statusLine.text).toContain("Deaktiviert.");
  });

  it("shows the live client status line when enabled", () => {
    const { containerEl } = makeTab({ remoteEnabled: true }, { remoteStatus: "connected" });
    const statusLine = containerEl.querySelectorAll(".rag-chat-remote-status-line")[0];
    expect(statusLine.text).toContain("Verbunden.");
  });
});
