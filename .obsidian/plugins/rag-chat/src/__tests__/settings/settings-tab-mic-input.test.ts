import { describe, expect, it } from "vitest";
import { DropdownComponent, Setting } from "../mocks/obsidian";
import { makeTab } from "./settings-tab-harness";

describe("RagChatSettingTab.display (mic input)", () => {
  it("renders the mic input device picker as the last Setting row, defaulting to Systemstandard", () => {
    makeTab();
    const setting = Setting.instances.at(-1)!;
    const nameEl = setting.settingEl.querySelectorAll(".setting-item-name")[0];
    expect(nameEl.text).toBe("Mikrofon (Spracheingabe)");
    const dropdown = setting.components[0] as DropdownComponent;
    expect(dropdown.value).toBe("");
  });

  it("persists the selected mic input device id on change", async () => {
    const { plugin } = makeTab();
    const setting = Setting.instances.at(-1)!;
    const dropdown = setting.components[0] as DropdownComponent;
    await dropdown.triggerChange("mic-device-123");
    expect(plugin.settings.micInputDeviceId).toBe("mic-device-123");
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });
});
