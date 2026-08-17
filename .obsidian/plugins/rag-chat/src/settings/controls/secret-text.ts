import { Setting, type ButtonComponent, type TextComponent } from "obsidian";

export interface SecretTextConfig {
  name: string;
  desc?: string;
  placeholder?: string;
  getValue: () => string;
  setValue: (value: string) => Promise<void> | void;
  /**
   * True when a secret is stored but still encrypted. The field is empty in
   * that case, so without this hint it looks like no key was ever saved.
   */
  isLocked?: () => boolean;
}

/**
 * A masked secret field with an explicit save button.
 *
 * Saving a secret asks for the encryption password, so it must NOT happen on
 * every keystroke: persisting per character would pop a password prompt for
 * every letter of a pasted API key. Edits are therefore buffered locally and
 * only committed when the user clicks save (or presses Enter).
 */
export function addSecretText(containerEl: HTMLElement, config: SecretTextConfig): Setting {
  let inputEl: HTMLInputElement | undefined;
  let textComponent: TextComponent | undefined;
  let saveButton: ButtonComponent | undefined;
  let committed = config.getValue();
  let pending = committed;
  let saving = false;

  const setting = new Setting(containerEl).setName(config.name);
  if (config.desc) setting.setDesc(config.desc);

  const locked = config.isLocked?.() ?? false;
  if (locked) {
    setting.descEl.createDiv({
      cls: "rag-chat-secret-locked-hint",
      text:
        "Ein verschlüsselter Schlüssel ist gespeichert, aber gesperrt. Passwort eingeben, um ihn zu " +
        "nutzen - oder hier einen neuen Schlüssel eintragen und speichern, um ihn zu ersetzen.",
    });
  }

  const syncSaveButton = (): void => {
    saveButton?.setDisabled(saving || pending === committed);
  };

  const commit = async (): Promise<void> => {
    if (saving || pending === committed) return;
    saving = true;
    syncSaveButton();
    try {
      await config.setValue(pending);
    } finally {
      saving = false;
      // Re-read instead of assuming success: a cancelled password prompt makes
      // the store revert the value, and the field must show what was actually
      // persisted rather than the discarded input.
      committed = config.getValue();
      pending = committed;
      textComponent?.setValue(committed);
      syncSaveButton();
    }
  };

  setting
    .addText((text) => {
      textComponent = text;
      text
        .setPlaceholder(locked ? "gesperrt - Passwort erforderlich" : (config.placeholder ?? "AIza..."))
        .setValue(committed)
        .onChange((value) => {
          pending = value.trim();
          syncSaveButton();
        });
      inputEl = text.inputEl;
      inputEl.type = "password";
      inputEl.addEventListener("keydown", (evt: KeyboardEvent) => {
        if (evt.key !== "Enter") return;
        evt.preventDefault();
        void commit();
      });
    })
    .addButton((button) => {
      button.setIcon("eye").setTooltip("API-Schlüssel anzeigen/verbergen");
      button.onClick(() => {
        if (!inputEl) return;
        const revealed = inputEl.type === "text";
        inputEl.type = revealed ? "password" : "text";
        button.setIcon(revealed ? "eye" : "eye-off");
      });
    })
    .addButton((button) => {
      saveButton = button;
      button
        .setIcon("save")
        .setTooltip("API-Schlüssel speichern (fragt nach dem Passwort)")
        .onClick(() => commit());
      syncSaveButton();
    });

  return setting;
}
