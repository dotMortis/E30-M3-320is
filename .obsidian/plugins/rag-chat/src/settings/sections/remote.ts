import { Setting } from "obsidian";
import type RagChatPlugin from "../../main";
import type { RemoteBridgeStatus } from "../../remote/bridge-client";

function remoteStatusLabel(status: RemoteBridgeStatus | null, enabled: boolean): string {
  if (!enabled) return "Deaktiviert.";
  switch (status) {
    case "connected":
      return "Verbunden.";
    case "starting":
      return "Verbindungsaufbau...";
    case "disconnected":
      return "Getrennt (Empfänger nicht gefunden oder USB-Kabel nicht angeschlossen).";
    case "error":
      return "Fehler - siehe Entwicklertools-Konsole.";
    case "unsupported":
      return "Nicht unterstützt (nur Desktop, Windows/Linux x64).";
    default:
      return "Unbekannt.";
  }
}

/**
 * Hardware voice remote (hardware/voice-remote/PLAN.md): a battery-powered
 * ESP32 button that starts/stops the mic-button recording remotely over
 * ESP-NOW -> USB serial -> this plugin. Off by default and only relevant on
 * this specific machine's paired hardware.
 */
export function renderRemoteSection(containerEl: HTMLElement, plugin: RagChatPlugin): void {
  const statusLine = containerEl.createDiv({ cls: "setting-item-description rag-chat-remote-status-line" });
  const updateStatusLine = (): void => {
    statusLine.setText(`Status: ${remoteStatusLabel(plugin.getRemoteStatus(), plugin.settings.remoteEnabled)}`);
  };

  new Setting(containerEl)
    .setName("Hardware-Fernbedienung aktivieren")
    .setDesc(
      "Startet/beendet die Sprachaufnahme über eine externe ESP32-Funk-Fernbedienung " +
        "(siehe hardware/voice-remote/PLAN.md). Nur für dieses Gerät relevant - betrifft keine " +
        "anderen Nutzer dieses Vaults.",
    )
    .addToggle((toggle) => {
      toggle.setValue(plugin.settings.remoteEnabled).onChange(async (value) => {
        plugin.settings.remoteEnabled = value;
        await plugin.saveSettings();
        plugin.refreshRemoteBridge();
        updateStatusLine();
      });
    });

  new Setting(containerEl)
    .setName("Serieller Port (optional)")
    .setDesc(
      "Nur nötig, falls der Empfänger nicht automatisch gefunden wird, z.B. /dev/ttyACM0 oder COM5. " +
        "Leer lassen für automatische Erkennung.",
    )
    .addText((text) => {
      text.setPlaceholder("automatisch").setValue(plugin.settings.remoteSerialPortOverride);
      text.onChange(async (value) => {
        plugin.settings.remoteSerialPortOverride = value.trim();
        await plugin.saveSettings();
        plugin.refreshRemoteBridge();
        updateStatusLine();
      });
    });

  updateStatusLine();
}
