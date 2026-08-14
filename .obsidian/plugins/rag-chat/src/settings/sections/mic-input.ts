import { Setting, type DropdownComponent } from "obsidian";
import type RagChatPlugin from "../../main";
import { listInputDevices } from "../../stt/devices";
import { unlockDeviceLabels } from "../../tts/devices";

export function renderMicInputSection(containerEl: HTMLElement, plugin: RagChatPlugin): void {
  let deviceDropdown: DropdownComponent | undefined;

  const refreshDeviceOptions = async (): Promise<void> => {
    if (!deviceDropdown) return;
    const devices = await listInputDevices();
    const current = plugin.settings.micInputDeviceId;

    deviceDropdown.selectEl.empty();
    deviceDropdown.addOption("", "Systemstandard");
    for (const device of devices) {
      if (!device.deviceId || device.deviceId === "default") continue;
      deviceDropdown.addOption(device.deviceId, device.label || `Gerät ${device.deviceId.slice(0, 8)}`);
    }
    const hasCurrent = current === "" || devices.some((d) => d.deviceId === current);
    deviceDropdown.setValue(hasCurrent ? current : "");
  };

  new Setting(containerEl)
    .setName("Mikrofon (Spracheingabe)")
    .setDesc(
      "Mikrofon für die Sprachaufnahme-Taste im Chat. " +
        '"Geräte erkennen" fragt einmalig nach Mikrofonberechtigung, nur um Gerätenamen auszulesen ' +
        "- es wird nichts aufgenommen oder übertragen.",
    )
    .addDropdown((dropdown) => {
      deviceDropdown = dropdown;
      dropdown.addOption("", "Systemstandard");
      dropdown.onChange(async (value) => {
        plugin.settings.micInputDeviceId = value;
        await plugin.saveSettings();
      });
    })
    .addButton((button) => {
      button.setButtonText("Geräte erkennen");
      button.onClick(async () => {
        button.setDisabled(true);
        await unlockDeviceLabels();
        await refreshDeviceOptions();
        button.setDisabled(false);
      });
    });

  void refreshDeviceOptions();
}
