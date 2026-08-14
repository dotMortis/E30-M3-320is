import { setIcon } from "obsidian";

export interface ToolbarElements {
  modelSelectEl: HTMLSelectElement;
  modelRefreshButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
}

export function buildToolbar(container: HTMLElement): ToolbarElements {
  const toolbarRow = container.createDiv({ cls: "rag-chat-toolbar-row" });

  const modelControls = toolbarRow.createDiv({ cls: "rag-chat-model-controls" });
  const modelSelectEl = modelControls.createEl("select", { cls: "rag-chat-model-select" });
  const modelRefreshButton = modelControls.createEl("button", {
    cls: "rag-chat-model-refresh",
    attr: { "aria-label": "Modellliste aktualisieren" },
  });
  setIcon(modelRefreshButton, "refresh-cw");

  const clearButton = toolbarRow.createEl("button", {
    cls: "rag-chat-clear-button",
    text: "Chat leeren",
  });

  return { modelSelectEl, modelRefreshButton, clearButton };
}
