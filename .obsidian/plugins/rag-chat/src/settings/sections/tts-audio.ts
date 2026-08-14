import { App, Setting, type DropdownComponent } from "obsidian";
import { TTS_FREE_TIER_CHAR_LIMIT } from "../../constants";
import type RagChatPlugin from "../../main";
import { listOutputDevices, unlockDeviceLabels } from "../../tts/devices";
import * as ttsPlayback from "../../tts/playback";
import { confirmModal } from "../../view/confirm-modal";

export function renderTtsAudioSection(
  containerEl: HTMLElement,
  plugin: RagChatPlugin,
  app: App,
): void {
  renderDevicePicker(containerEl, plugin);

  new Setting(containerEl).setName("Lautstärke").addSlider((slider) =>
    slider
      .setLimits(0, 1, 0.01)
      .setValue(plugin.settings.ttsVolume)
      .onChange(async (value) => {
        ttsPlayback.setVolume(value);
        plugin.settings.ttsVolume = value;
        await plugin.saveSettings();
      }),
  );

  renderCharCounter(containerEl, plugin, app);
}

function renderDevicePicker(
  containerEl: HTMLElement,
  plugin: RagChatPlugin,
): void {
  let deviceDropdown: DropdownComponent | undefined;

  const refreshDeviceOptions = async (): Promise<void> => {
    if (!deviceDropdown) return;
    const devices = await listOutputDevices();
    const current = plugin.settings.ttsOutputDeviceId;

    deviceDropdown.selectEl.empty();
    deviceDropdown.addOption("", "Systemstandard");
    for (const device of devices) {
      if (!device.deviceId || device.deviceId === "default") continue;
      deviceDropdown.addOption(
        device.deviceId,
        device.label || `Gerät ${device.deviceId.slice(0, 8)}`,
      );
    }
    const hasCurrent =
      current === "" || devices.some((d) => d.deviceId === current);
    deviceDropdown.setValue(hasCurrent ? current : "");
  };

  new Setting(containerEl)
    .setName("Audioausgabegerät")
    .setDesc(
      '"Geräte erkennen" fragt einmalig nach Mikrofonberechtigung, nur um Gerätenamen auszulesen ' +
        "- es wird nichts aufgenommen oder übertragen.",
    )
    .addDropdown((dropdown) => {
      deviceDropdown = dropdown;
      dropdown.addOption("", "Systemstandard");
      dropdown.onChange(async (value) => {
        plugin.settings.ttsOutputDeviceId = value;
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

function renderCharCounter(
  containerEl: HTMLElement,
  plugin: RagChatPlugin,
  app: App,
): void {
  const setting = new Setting(containerEl).setName(
    "Zeichenzähler (Chirp 3 HD)",
  );
  const updateDesc = (): void => {
    const used = plugin.settings.ttsCharCount.toLocaleString("de-DE");
    const limit = TTS_FREE_TIER_CHAR_LIMIT.toLocaleString("de-DE");
    setting.setDesc(`${used} / ${limit} Zeichen (Freikontingent).`);
  };
  updateDesc();
  setting.addButton((button) => {
    button.setButtonText("Zurücksetzen").setWarning();
    button.onClick(async () => {
      const confirmed = await confirmModal(
        app,
        "Zeichenzähler wirklich zurücksetzen?",
      );
      if (!confirmed) return;
      plugin.settings.ttsCharCount = 0;
      await plugin.saveSettings();
      updateDesc();
    });
  });
}
