import { Setting } from "obsidian";
import type RagChatPlugin from "../../main";
import type { RemoteBridgeStatus } from "../../remote/bridge-client";

/**
 * How long to wait after the last keystroke in the port-override field before
 * applying it. Obsidian fires onChange per character, and every apply kills
 * and respawns the bridge child process - without this, typing
 * "/dev/ttyACM0" would restart it a dozen times with nonsense port values.
 */
const PORT_OVERRIDE_DEBOUNCE_MS = 600;

/**
 * Human-readable status. `detail` is the concrete reason reported by the
 * bridge (which port it settled on, why it can't connect, why the platform is
 * unsupported) - it replaces the generic sentence rather than being appended
 * to it, since it says the same thing but specifically.
 */
function remoteStatusLabel(status: RemoteBridgeStatus | null, enabled: boolean, detail?: string): string {
  if (!enabled) return "Deaktiviert.";
  switch (status) {
    case "connected":
      return detail ? `Verbunden (${detail}).` : "Verbunden.";
    case "starting":
      return "Verbindungsaufbau...";
    case "disconnected":
      return detail ? `Getrennt: ${detail}` : "Getrennt (Empfänger nicht gefunden oder USB-Kabel nicht angeschlossen).";
    case "error":
      return detail ? `Fehler: ${detail}` : "Fehler - siehe Entwicklertools-Konsole.";
    case "unsupported":
      return detail ? `Nicht unterstützt: ${detail}` : "Nicht unterstützt (nur Desktop, Windows/Linux x64).";
    default:
      return "Unbekannt.";
  }
}

/**
 * Hardware voice remote (hardware/voice-remote/PLAN.md): a battery-powered
 * ESP32 button that starts/stops the mic-button recording remotely over
 * ESP-NOW -> USB serial -> this plugin. Off by default and only relevant on
 * this specific machine's paired hardware.
 *
 * Returns a dispose function that must be called when the settings tab is
 * hidden (it unsubscribes from live bridge status updates).
 */
export function renderRemoteSection(containerEl: HTMLElement, plugin: RagChatPlugin): () => void {
  const statusLine = containerEl.createDiv({ cls: "setting-item-description rag-chat-remote-status-line" });
  const updateStatusLine = (): void => {
    const enabled = plugin.settings.remoteEnabled;
    const status = plugin.getRemoteStatus();
    // Show the detail (why unsupported, which binary is missing, the actual
    // serial-open error) instead of just telling the user "there was an
    // error" - this is the only place it is visible without a console.
    const detail = enabled ? plugin.getRemoteStatusDetail?.() : undefined;
    statusLine.setText(`Status: ${remoteStatusLabel(status, enabled, detail)}`);
  };

  // Follow status changes while the tab is open; otherwise the line would be
  // frozen at whatever the status was when the tab was rendered (typically
  // "Verbindungsaufbau...", even long after the bridge connected).
  const unsubscribe = plugin.onRemoteStatusChange?.(updateStatusLine) ?? (() => undefined);

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

  let portDebounce: ReturnType<typeof setTimeout> | null = null;
  const clearPortDebounce = (): void => {
    if (portDebounce) {
      clearTimeout(portDebounce);
      portDebounce = null;
    }
  };

  new Setting(containerEl)
    .setName("Serieller Port (optional)")
    .setDesc(
      "Nur nötig, falls der Empfänger nicht automatisch gefunden wird, z.B. /dev/ttyACM0 oder COM5. " +
        "Leer lassen für automatische Erkennung.",
    )
    .addText((text) => {
      text.setPlaceholder("automatisch").setValue(plugin.settings.remoteSerialPortOverride);
      text.onChange((value) => {
        clearPortDebounce();
        portDebounce = setTimeout(() => {
          portDebounce = null;
          void (async () => {
            plugin.settings.remoteSerialPortOverride = value.trim();
            await plugin.saveSettings();
            plugin.refreshRemoteBridge();
            updateStatusLine();
          })();
        }, PORT_OVERRIDE_DEBOUNCE_MS);
      });
    });

  updateStatusLine();

  return () => {
    clearPortDebounce();
    unsubscribe();
  };
}
