export interface ComposerElements {
  clarificationRow: HTMLElement;
  cancelClarificationButton: HTMLButtonElement;
  inputEl: HTMLTextAreaElement;
  sendButton: HTMLButtonElement;
  thinkingCheckboxEl: HTMLInputElement;
  webSearchCheckboxEl: HTMLInputElement;
  ttsCheckboxEl: HTMLInputElement;
}

function optionToggle(inputRow: HTMLElement, title: string, label: string): HTMLInputElement {
  const toggleLabel = inputRow.createEl("label", { cls: "rag-chat-option-toggle", attr: { title } });
  const checkbox = toggleLabel.createEl("input", {
    cls: "rag-chat-option-checkbox",
    attr: { type: "checkbox" },
  });
  toggleLabel.createSpan({ text: label });
  return checkbox;
}

export function buildComposer(container: HTMLElement): ComposerElements {
  const clarificationRow = container.createDiv({ cls: "rag-chat-clarification-row" });
  const cancelClarificationButton = clarificationRow.createEl("button", {
    cls: "rag-chat-cancel-clarification rag-chat-hidden",
    text: "Rückfrage abbrechen",
  });

  const inputRow = container.createDiv({ cls: "rag-chat-input-row" });
  const inputEl = inputRow.createEl("textarea", {
    cls: "rag-chat-input",
    attr: {
      placeholder: "Frage zum Handbuch stellen... (z.B. Anzugsdrehmoment Zylinderkopf)",
    },
  });

  const controlsRow = container.createDiv({ cls: "rag-chat-input-controls" });

  const thinkingCheckboxEl = optionToggle(
    controlsRow,
    "Lässt das Modell vor der Antwort nachdenken - genauer, aber spürbar langsamer.",
    "Denken",
  );
  const webSearchCheckboxEl = optionToggle(
    controlsRow,
    "Erlaubt dem Modell, das Web nach zusätzlichem Kontext zu durchsuchen - fügt Latenz hinzu.",
    "Websuche",
  );

  const ttsToggleLabel = controlsRow.createEl("label", { cls: "rag-chat-tts-toggle" });
  const ttsCheckboxEl = ttsToggleLabel.createEl("input", {
    cls: "rag-chat-tts-checkbox",
    attr: { type: "checkbox" },
  });
  ttsToggleLabel.createSpan({ text: "Sprachausgabe" });

  const sendButton = controlsRow.createEl("button", { cls: "rag-chat-send", text: "Fragen" });

  return {
    clarificationRow,
    cancelClarificationButton,
    inputEl,
    sendButton,
    thinkingCheckboxEl,
    webSearchCheckboxEl,
    ttsCheckboxEl,
  };
}
