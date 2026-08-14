import { TTS_FREE_TIER_CHAR_LIMIT } from "../constants";
import type RagChatPlugin from "../main";
import * as ttsPlayback from "../tts/playback";
import { refreshTtsDeviceOptions } from "./tts-device-options";
import type { TtsControlsElements } from "./ui/tts-controls";

export class TtsControlsController {
  constructor(
    private readonly els: TtsControlsElements,
    private readonly plugin: RagChatPlugin,
    private readonly isClosed: () => boolean,
    private readonly isBusy: () => boolean,
  ) {}

  syncFromSettings(): void {
    this.els.volumeSliderEl.value = String(this.plugin.settings.ttsVolume);
    this.updateVolumeLabel();
    this.updateCharCounter();
    this.updateVisibility();
  }

  updateVisibility(): void {
    this.els.controlsRow.toggleClass("rag-chat-hidden", !this.plugin.settings.ttsEnabled);
  }

  updateVolumeLabel(): void {
    const pct = Math.round(Number(this.els.volumeSliderEl.value) * 100);
    this.els.volumeLabelEl.setText(`${pct}%`);
  }

  updateCharCounter(): void {
    const used = this.plugin.settings.ttsCharCount.toLocaleString("de-DE");
    const limit = TTS_FREE_TIER_CHAR_LIMIT.toLocaleString("de-DE");
    this.els.charCounterEl.setText(`${used} / ${limit} Zeichen (Freikontingent)`);
  }

  refreshDevices(): Promise<void> {
    return refreshTtsDeviceOptions({
      selectEl: this.els.deviceSelectEl,
      currentDeviceId: this.plugin.settings.ttsOutputDeviceId,
      isClosed: this.isClosed,
      isBusy: this.isBusy,
      setDisabled: (disabled) => {
        this.els.deviceRefreshButton.disabled = disabled;
      },
    });
  }

  async commitVolume(): Promise<void> {
    this.plugin.settings.ttsVolume = Number(this.els.volumeSliderEl.value);
    await this.plugin.saveSettings();
  }

  async commitDevice(): Promise<void> {
    this.plugin.settings.ttsOutputDeviceId = this.els.deviceSelectEl.value;
    await this.plugin.saveSettings();
  }

  onVolumeInput(): void {
    ttsPlayback.setVolume(Number(this.els.volumeSliderEl.value));
    this.updateVolumeLabel();
  }
}
