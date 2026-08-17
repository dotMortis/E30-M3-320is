import { describe, expect, it } from "vitest";
import { Setting, TextComponent, ToggleComponent } from "../mocks/obsidian";
import { makeTab } from "./settings-tab-harness";

function findSettingByName(name: string) {
  return Setting.instances.find(
    (s) => s.settingEl.querySelectorAll(".setting-item-name")[0]?.text === name,
  )!;
}

describe("RagChatSettingTab.display (hardware voice remote)", () => {
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

  it("persists a trimmed port override and calls refreshRemoteBridge() on change", async () => {
    const { plugin } = makeTab();
    const text = findSettingByName("Serieller Port (optional)").components[0] as TextComponent;

    await text.triggerChange("  /dev/ttyACM0  ");

    expect(plugin.settings.remoteSerialPortOverride).toBe("/dev/ttyACM0");
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
    expect(plugin.refreshRemoteBridge).toHaveBeenCalledTimes(1);
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
