import { App, Notice, Setting } from "obsidian";
import type RagChatPlugin from "../../main";
import { confirmModal } from "../../view/confirm-modal";
import { passwordModal } from "../../view/password-modal";

/**
 * Password protection for the stored API keys.
 *
 * The password is never persisted (not even hashed): correctness is proven by
 * successfully decrypting an existing secret. That is also why "forgot
 * password" can only mean "throw the secrets away".
 *
 * Returns a dispose function that unsubscribes from lock-state updates.
 */
export function renderSecuritySection(
  containerEl: HTMLElement,
  plugin: RagChatPlugin,
  app: App,
): () => void {
  containerEl.createEl("h3", { text: "Sicherheit" });

  const statusLine = containerEl.createDiv({ cls: "setting-item-description" });
  const updateStatusLine = (): void => {
    if (!plugin.store.hasProtectedSecrets()) {
      statusLine.setText(
        "Status: Keine Schlüssel gespeichert. Beim nächsten Speichern eines API-Schlüssels wird ein Passwort festgelegt.",
      );
      return;
    }
    statusLine.setText(
      plugin.store.isLocked()
        ? "Status: Gespeicherte Schlüssel sind gesperrt - Passwort eingeben, um sie zu nutzen."
        : "Status: Gespeicherte Schlüssel sind für diese Sitzung entsperrt.",
    );
  };

  // Keep the line (and the buttons' enabled state) in sync while the tab is
  // open: unlocking can happen from the chat overlay or a command, not just here.
  const unsubscribe = plugin.store.onLockStateChange(() => {
    updateStatusLine();
    syncButtons();
  });

  let unlockButtonEl: HTMLButtonElement | undefined;
  let lockButtonEl: HTMLButtonElement | undefined;
  const syncButtons = (): void => {
    const has = plugin.store.hasProtectedSecrets();
    const locked = plugin.store.isLocked();
    if (unlockButtonEl) unlockButtonEl.disabled = !has || !locked;
    if (lockButtonEl) lockButtonEl.disabled = !has || locked;
  };

  new Setting(containerEl)
    .setName("Schlüssel entsperren / sperren")
    .setDesc(
      "Entsperren entschlüsselt die gespeicherten API-Schlüssel für diese Sitzung. " +
        "Sperren entfernt sie wieder aus dem Speicher, ohne sie zu löschen.",
    )
    .addButton((button) => {
      button.setButtonText("Entsperren").onClick(async () => {
        await plugin.promptUnlock();
        updateStatusLine();
        syncButtons();
      });
      unlockButtonEl = button.buttonEl;
    })
    .addButton((button) => {
      button.setButtonText("Sperren").onClick(() => {
        plugin.store.lock();
        updateStatusLine();
        syncButtons();
        new Notice("RAG Chat: Secrets gesperrt.");
      });
      lockButtonEl = button.buttonEl;
    });

  new Setting(containerEl)
    .setName("Passwort ändern")
    .setDesc(
      "Verschlüsselt die gespeicherten Schlüssel mit einem neuen Passwort. " +
        "Alle Schlüssel müssen dafür entsperrt sein.",
    )
    .addButton((button) => {
      button.setButtonText("Passwort ändern").onClick(async () => {
        if (!plugin.store.hasProtectedSecrets()) {
          new Notice("RAG Chat: Es sind noch keine Schlüssel gespeichert.");
          return;
        }
        // Changing the password must re-encrypt *every* secret; a locked one
        // would silently stay on the old password and fail to unlock later.
        if (plugin.store.isLocked() && !(await plugin.promptUnlock())) return;

        const current = await passwordModal(app, {
          mode: "unlock",
          label: "Aktuelles Passwort",
        });
        if (current === null) return;
        const next = await passwordModal(app, {
          mode: "create",
          label: "Neues Passwort",
        });
        if (next === null) return;

        const ok = await plugin.store.changePassword(current, next);
        new Notice(
          ok
            ? "RAG Chat: Passwort geändert."
            : "RAG Chat: Passwort konnte nicht geändert werden (falsches aktuelles Passwort?).",
          8000,
        );
        updateStatusLine();
        syncButtons();
      });
    });

  new Setting(containerEl)
    .setName("Passwort vergessen")
    .setDesc(
      "Löscht die verschlüsselt gespeicherten API-Schlüssel. Sie sind ohne Passwort nicht " +
        "wiederherstellbar - danach Schlüssel und Passwort neu eingeben.",
    )
    .addButton((button) => {
      button.setButtonText("Schlüssel zurücksetzen").setWarning();
      button.onClick(async () => {
        const confirmed = await confirmModal(
          app,
          "Gespeicherte API-Schlüssel wirklich löschen? Sie können ohne Passwort nicht wiederhergestellt werden.",
        );
        if (!confirmed) return;
        await plugin.store.resetSecrets();
        new Notice("RAG Chat: Gespeicherte Schlüssel gelöscht - bitte neu eingeben.", 8000);
        updateStatusLine();
        syncButtons();
      });
    });

  updateStatusLine();
  syncButtons();

  return unsubscribe;
}
