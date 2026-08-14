import { setIcon } from "obsidian";

export interface TtsControlsElements {
  controlsRow: HTMLElement;
  deviceSelectEl: HTMLSelectElement;
  deviceRefreshButton: HTMLButtonElement;
  volumeSliderEl: HTMLInputElement;
  volumeLabelEl: HTMLElement;
  charCounterEl: HTMLElement;
}

export function buildTtsControls(container: HTMLElement): TtsControlsElements {
  const controlsRow = container.createEl("details", { cls: "rag-chat-tts-controls" });
  controlsRow.createEl("summary", {
    cls: "rag-chat-tts-controls-summary",
    text: "Sprachausgabe-Einstellungen",
  });
  const body = controlsRow.createDiv({ cls: "rag-chat-tts-controls-body" });

  const deviceGroup = body.createDiv({ cls: "rag-chat-tts-device" });
  const deviceSelectEl = deviceGroup.createEl("select");
  const deviceRefreshButton = deviceGroup.createEl("button", {
    attr: { "aria-label": "Audioausgabegeräte aktualisieren" },
  });
  setIcon(deviceRefreshButton, "refresh-cw");

  const volumeGroup = body.createDiv({ cls: "rag-chat-tts-volume" });
  const volumeSliderEl = volumeGroup.createEl("input", {
    attr: { type: "range", min: "0", max: "1", step: "0.05" },
  });
  const volumeLabelEl = volumeGroup.createSpan({ cls: "rag-chat-tts-volume-label" });

  const charCounterEl = body.createDiv({ cls: "rag-chat-tts-char-counter" });

  return {
    controlsRow,
    deviceSelectEl,
    deviceRefreshButton,
    volumeSliderEl,
    volumeLabelEl,
    charCounterEl,
  };
}
