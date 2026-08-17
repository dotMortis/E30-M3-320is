import { describe, expect, it, vi } from "vitest";
import { ButtonComponent, Modal, Notice, Setting } from "../mocks/obsidian";
import type { FakeElement } from "../mocks/dom";
import { makeTab } from "./settings-tab-harness";

function findSettingByName(name: string) {
  return Setting.instances.find(
    (s) => s.settingEl.querySelectorAll(".setting-item-name")[0]?.text === name,
  )!;
}

function buttonByText(settingName: string, text: string): ButtonComponent {
  const setting = findSettingByName(settingName);
  const button = setting.components.find(
    (c) => c instanceof ButtonComponent && c.getButtonText() === text,
  );
  return button as ButtonComponent;
}

/** Status line rendered by the security section (last such div in the tab). */
function statusText(containerEl: FakeElement): string {
  const lines = containerEl.children.filter((c) => c.classes.has("setting-item-description"));
  return lines.at(-1)?.text ?? "";
}

/** Types `password` into the newest password modal and confirms it. */
function submitModal(password: string | null): void {
  const modal = Modal.instances.at(-1)!;
  const contentEl = modal.contentEl as unknown as FakeElement;
  if (password === null) {
    const cancel = contentEl
      .querySelectorAll("button")
      .find((b) => b.text === "Abbrechen")!;
    cancel.dispatch("click");
    return;
  }
  const inputs = contentEl.querySelectorAll("input");
  for (const input of inputs) input.value = password;
  const submit = contentEl
    .querySelectorAll("button")
    .find((b) => b.text !== "Abbrechen")!;
  submit.dispatch("click");
}

describe("RagChatSettingTab security section", () => {
  it("reports that no keys are stored yet", () => {
    const { containerEl } = makeTab({}, { locked: false, hasProtectedSecrets: false });
    expect(statusText(containerEl)).toContain("Keine Schlüssel gespeichert");
  });

  it("reports locked stored keys", () => {
    const { containerEl } = makeTab({}, { locked: true });
    expect(statusText(containerEl)).toContain("gesperrt");
  });

  it("reports unlocked stored keys", () => {
    const { containerEl } = makeTab({}, { locked: false, hasProtectedSecrets: true });
    expect(statusText(containerEl)).toContain("entsperrt");
  });

  it("enables only Entsperren while locked", () => {
    makeTab({}, { locked: true });
    expect(buttonByText("Schlüssel entsperren / sperren", "Entsperren").el.disabled).toBe(false);
    expect(buttonByText("Schlüssel entsperren / sperren", "Sperren").el.disabled).toBe(true);
  });

  it("enables only Sperren while unlocked", () => {
    makeTab({}, { locked: false, hasProtectedSecrets: true });
    expect(buttonByText("Schlüssel entsperren / sperren", "Entsperren").el.disabled).toBe(true);
    expect(buttonByText("Schlüssel entsperren / sperren", "Sperren").el.disabled).toBe(false);
  });

  it("disables both buttons when nothing is stored", () => {
    makeTab({}, { locked: false, hasProtectedSecrets: false });
    expect(buttonByText("Schlüssel entsperren / sperren", "Entsperren").el.disabled).toBe(true);
    expect(buttonByText("Schlüssel entsperren / sperren", "Sperren").el.disabled).toBe(true);
  });

  it("Entsperren delegates to the plugin's unlock prompt", async () => {
    const { plugin } = makeTab({}, { locked: true });
    await buttonByText("Schlüssel entsperren / sperren", "Entsperren").triggerClick();
    expect(plugin.promptUnlock).toHaveBeenCalledTimes(1);
  });

  it("Sperren locks the store and notifies the user", async () => {
    const { store } = makeTab({}, { locked: false, hasProtectedSecrets: true });
    await buttonByText("Schlüssel entsperren / sperren", "Sperren").triggerClick();
    expect(store.lock).toHaveBeenCalledTimes(1);
    expect(Notice.instances.some((n) => n.message.includes("gesperrt"))).toBe(true);
  });

  it("refreshes the status line when the lock state changes elsewhere", () => {
    const { containerEl, store, emitLockStateChange } = makeTab(
      {},
      { locked: true },
    );
    expect(statusText(containerEl)).toContain("gesperrt");

    // Simulate an unlock via the chat overlay or the command palette.
    store.isLocked.mockReturnValue(false);
    emitLockStateChange();

    expect(statusText(containerEl)).toContain("entsperrt");
    expect(buttonByText("Schlüssel entsperren / sperren", "Sperren").el.disabled).toBe(false);
  });

  it("stops listening to lock-state changes once hidden", () => {
    const { tab, lockStateListeners } = makeTab({}, { locked: true });
    expect(lockStateListeners.size).toBe(1);
    tab.hide();
    expect(lockStateListeners.size).toBe(0);
  });

  it("refuses to change the password when nothing is stored", async () => {
    const { store } = makeTab({}, { locked: false, hasProtectedSecrets: false });
    await buttonByText("Passwort ändern", "Passwort ändern").triggerClick();
    expect(store.changePassword).not.toHaveBeenCalled();
    expect(Notice.instances.some((n) => n.message.includes("noch keine Schlüssel"))).toBe(true);
  });

  it("passes the current and new password to the store when changing it", async () => {
    const { store } = makeTab({}, { locked: false, hasProtectedSecrets: true });
    const click = buttonByText("Passwort ändern", "Passwort ändern").triggerClick();

    await vi.waitFor(() => expect(Modal.instances).toHaveLength(1));
    submitModal("old-password");
    await vi.waitFor(() => expect(Modal.instances).toHaveLength(2));
    submitModal("new-password");
    await click;

    expect(store.changePassword).toHaveBeenCalledWith("old-password", "new-password");
    expect(Notice.instances.some((n) => n.message.includes("Passwort geändert"))).toBe(true);
  });

  it("aborts the password change when the first prompt is cancelled", async () => {
    const { store } = makeTab({}, { locked: false, hasProtectedSecrets: true });
    const click = buttonByText("Passwort ändern", "Passwort ändern").triggerClick();

    await vi.waitFor(() => expect(Modal.instances).toHaveLength(1));
    submitModal(null);
    await click;

    expect(store.changePassword).not.toHaveBeenCalled();
  });

  it("reports a failed password change", async () => {
    const { store } = makeTab({}, { locked: false, hasProtectedSecrets: true });
    store.changePassword.mockResolvedValue(false);
    const click = buttonByText("Passwort ändern", "Passwort ändern").triggerClick();

    await vi.waitFor(() => expect(Modal.instances).toHaveLength(1));
    submitModal("wrong-password");
    await vi.waitFor(() => expect(Modal.instances).toHaveLength(2));
    submitModal("new-password");
    await click;

    expect(Notice.instances.some((n) => n.message.includes("nicht geändert werden"))).toBe(true);
  });

  it("unlocks first when changing the password while locked", async () => {
    const { plugin, store } = makeTab({}, { locked: true });
    plugin.promptUnlock.mockResolvedValue(false);

    await buttonByText("Passwort ändern", "Passwort ändern").triggerClick();

    expect(plugin.promptUnlock).toHaveBeenCalledTimes(1);
    // Unlock was declined, so nothing further happened.
    expect(store.changePassword).not.toHaveBeenCalled();
  });

  it("resets the stored secrets only after confirmation", async () => {
    const { store } = makeTab({}, { locked: true });
    const click = buttonByText("Passwort vergessen", "Schlüssel zurücksetzen").triggerClick();

    await vi.waitFor(() => expect(Modal.instances).toHaveLength(1));
    const confirmEl = Modal.instances[0].contentEl as unknown as FakeElement;
    confirmEl.querySelectorAll("button").find((b) => b.text === "Ja")!.dispatch("click");
    await click;

    expect(store.resetSecrets).toHaveBeenCalledTimes(1);
    expect(Notice.instances.some((n) => n.message.includes("gelöscht"))).toBe(true);
  });

  it("does not reset when the confirmation is declined", async () => {
    const { store } = makeTab({}, { locked: true });
    const click = buttonByText("Passwort vergessen", "Schlüssel zurücksetzen").triggerClick();

    await vi.waitFor(() => expect(Modal.instances).toHaveLength(1));
    const confirmEl = Modal.instances[0].contentEl as unknown as FakeElement;
    confirmEl.querySelectorAll("button").find((b) => b.text === "Nein")!.dispatch("click");
    await click;

    expect(store.resetSecrets).not.toHaveBeenCalled();
  });

  it("marks the reset button as destructive", () => {
    makeTab({}, { locked: true });
    expect(buttonByText("Passwort vergessen", "Schlüssel zurücksetzen").isWarning()).toBe(true);
  });
});

describe("addSecretText locked hint", () => {
  it("hints that a stored key is locked and shows a locked placeholder", () => {
    makeTab({}, { locked: true });
    const apiKeySetting = Setting.instances[0];
    expect(apiKeySetting.descEl.children.some((c) => c.classes.has("rag-chat-secret-locked-hint"))).toBe(
      true,
    );
    expect(apiKeySetting.components[0].el.getAttribute("placeholder")).toBe(
      "gesperrt - Passwort erforderlich",
    );
  });

  it("shows no locked hint when the key is available", () => {
    makeTab({}, { locked: false });
    const apiKeySetting = Setting.instances[0];
    expect(apiKeySetting.descEl.children.some((c) => c.classes.has("rag-chat-secret-locked-hint"))).toBe(
      false,
    );
  });
});
