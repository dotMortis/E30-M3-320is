import { App, Modal } from "obsidian";
import type { PasswordPromptRequest } from "../settings/settings-store";

const TEXTS = {
  create: {
    title: "Passwort festlegen",
    intro:
      "Mit diesem Passwort werden deine API-Schlüssel verschlüsselt gespeichert. Es wird nirgends abgelegt - ohne das Passwort sind die Schlüssel nicht wiederherstellbar.",
    submit: "Speichern",
  },
  unlock: {
    title: "Passwort eingeben",
    intro: "Passwort eingeben, um die gespeicherten API-Schlüssel zu entsperren.",
    submit: "Entsperren",
  },
} as const;

class PasswordModal extends Modal {
  private resolved = false;

  constructor(
    app: App,
    private readonly request: PasswordPromptRequest,
    private readonly resolveFn: (value: string | null) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    const texts = TEXTS[this.request.mode];
    const { contentEl } = this;
    contentEl.addClass("rag-chat-password-modal");
    contentEl.createEl("h3", { text: texts.title });
    if (this.request.label) {
      contentEl.createEl("p", {
        cls: "rag-chat-password-modal-label",
        text: this.request.label,
      });
    }
    contentEl.createEl("p", { text: texts.intro });

    const errorEl = contentEl.createEl("p", { cls: "rag-chat-password-modal-error" });
    if (this.request.error) errorEl.setText(this.request.error);
    else errorEl.addClass("rag-chat-hidden");

    const passwordEl = contentEl.createEl("input", {
      cls: "rag-chat-password-input",
      attr: { placeholder: "Passwort" },
    });
    passwordEl.type = "password";

    // "create" asks twice: a typo here would otherwise silently produce a
    // secret the user can never unlock again.
    let confirmEl: HTMLInputElement | null = null;
    if (this.request.mode === "create") {
      confirmEl = contentEl.createEl("input", {
        cls: "rag-chat-password-input",
        attr: { placeholder: "Passwort wiederholen" },
      });
      confirmEl.type = "password";
    }

    const showError = (message: string): void => {
      errorEl.setText(message);
      errorEl.removeClass("rag-chat-hidden");
    };

    const submit = (): void => {
      const password = passwordEl.value;
      if (!password) {
        showError("Bitte ein Passwort eingeben.");
        return;
      }
      if (confirmEl && confirmEl.value !== password) {
        showError("Die Passwörter stimmen nicht überein.");
        return;
      }
      this.settle(password);
      this.close();
    };

    for (const input of [passwordEl, confirmEl]) {
      input?.addEventListener("keydown", (evt: KeyboardEvent) => {
        if (evt.key === "Enter") {
          evt.preventDefault();
          submit();
        }
      });
    }

    const buttonRow = contentEl.createDiv({ cls: "rag-chat-password-modal-buttons" });
    const cancelButton = buttonRow.createEl("button", { text: "Abbrechen" });
    cancelButton.addEventListener("click", () => {
      this.settle(null);
      this.close();
    });
    const submitButton = buttonRow.createEl("button", { cls: "mod-cta", text: texts.submit });
    submitButton.addEventListener("click", submit);

    passwordEl.focus();
  }

  onClose(): void {
    // Closing via Esc/backdrop counts as a cancel.
    this.settle(null);
    this.contentEl.empty();
  }

  private settle(value: string | null): void {
    if (this.resolved) return;
    this.resolved = true;
    this.resolveFn(value);
  }
}

/** Asks the user for a password. Resolves `null` when cancelled. */
export function passwordModal(app: App, request: PasswordPromptRequest): Promise<string | null> {
  return new Promise((resolve) => {
    new PasswordModal(app, request, resolve).open();
  });
}
