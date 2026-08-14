import { App, Modal } from "obsidian";

class ConfirmModal extends Modal {
  private message: string;
  private resolveFn: (value: boolean) => void;
  private resolved = false;

  constructor(app: App, message: string, resolveFn: (value: boolean) => void) {
    super(app);
    this.message = message;
    this.resolveFn = resolveFn;
  }

  onOpen(): void {
    this.contentEl.createEl("p", { text: this.message });
    const buttonRow = this.contentEl.createDiv({ cls: "rag-chat-confirm-modal-buttons" });
    const noButton = buttonRow.createEl("button", { text: "Nein" });
    noButton.addEventListener("click", () => {
      this.settle(false);
      this.close();
    });
    const yesButton = buttonRow.createEl("button", { cls: "mod-warning", text: "Ja" });
    yesButton.addEventListener("click", () => {
      this.settle(true);
      this.close();
    });
  }

  onClose(): void {
    this.settle(false);
    this.contentEl.empty();
  }

  private settle(value: boolean): void {
    if (this.resolved) return;
    this.resolved = true;
    this.resolveFn(value);
  }
}

export function confirmModal(app: App, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    new ConfirmModal(app, message, resolve).open();
  });
}
