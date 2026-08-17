import { describe, expect, it, vi } from "vitest";
import { Notice } from "./mocks/obsidian";
import { decryptSecret, encryptSecret } from "../secure-storage";
import type { PasswordPrompt } from "../settings/settings-store";
import { makePlugin } from "./main-harness";

const PASSWORD = "vault-password";

/** Stand-in for the password modal. Records every prompt it received. */
function fakePrompt(
  answers: (string | null)[],
): PasswordPrompt & { requests: { mode: string; label?: string; error?: string }[] } {
  const requests: { mode: string; label?: string; error?: string }[] = [];
  const prompt = vi.fn(async (request: { mode: string; label?: string; error?: string }) => {
    requests.push({ ...request });
    return answers.length ? (answers.shift() as string | null) : null;
  });
  return Object.assign(prompt as unknown as PasswordPrompt, { requests });
}

function persistedCalls(plugin: { saveData: unknown }): Record<string, string>[] {
  return (plugin.saveData as { mock: { calls: [Record<string, string>][] } }).mock.calls.map(
    (call) => call[0],
  );
}

describe("RagChatPlugin.loadSettings", () => {
  it("merges DEFAULT_SETTINGS with the persisted data", async () => {
    const { plugin } = makePlugin({ loadData: { topK: 12 } });
    await plugin.loadSettings();
    expect(plugin.settings.topK).toBe(12);
    expect(plugin.settings.embeddingModel).toBe("gemini-embedding-2");
  });

  it("leaves an encrypted key locked (empty in memory) until the password is supplied", async () => {
    const encrypted = await encryptSecret("my-real-api-key", PASSWORD);
    const { plugin } = makePlugin({ loadData: { geminiApiKey: encrypted } });
    await plugin.loadSettings();
    expect(plugin.settings.geminiApiKey).toBe("");
    expect(plugin.store.isLocked()).toBe(true);
    expect(plugin.store.hasProtectedSecrets()).toBe(true);
  });

  it("decrypts the key once unlocked with the right password", async () => {
    const encrypted = await encryptSecret("my-real-api-key", PASSWORD);
    const { plugin } = makePlugin({ loadData: { geminiApiKey: encrypted } });
    await plugin.loadSettings();

    const result = await plugin.store.unlock(PASSWORD);
    expect(result.unlocked).toEqual(["geminiApiKey"]);
    expect(plugin.settings.geminiApiKey).toBe("my-real-api-key");
    expect(plugin.store.isLocked()).toBe(false);
  });

  it("stays locked on a wrong password", async () => {
    const encrypted = await encryptSecret("my-real-api-key", PASSWORD);
    const { plugin } = makePlugin({ loadData: { geminiApiKey: encrypted } });
    await plugin.loadSettings();

    const result = await plugin.store.unlock("wrong");
    expect(result.unlocked).toEqual([]);
    expect(result.failed).toEqual(["geminiApiKey"]);
    expect(plugin.settings.geminiApiKey).toBe("");
    expect(plugin.store.isLocked()).toBe(true);
  });

  it("unlocks each secret independently, so one foreign blob can't block the other", async () => {
    const { plugin } = makePlugin({
      loadData: {
        geminiApiKey: await encryptSecret("gemini-key", PASSWORD),
        ttsApiKey: await encryptSecret("tts-key", "a-different-password"),
      },
    });
    await plugin.loadSettings();

    const result = await plugin.store.unlock(PASSWORD);
    expect(result.unlocked).toEqual(["geminiApiKey"]);
    expect(result.failed).toEqual(["ttsApiKey"]);
    expect(plugin.settings.geminiApiKey).toBe("gemini-key");
    expect(plugin.settings.ttsApiKey).toBe("");
    // One secret is still encrypted, so the vault as a whole stays "locked".
    expect(plugin.store.isLocked()).toBe(true);
    expect(plugin.store.isSecretLocked("geminiApiKey")).toBe(false);
    expect(plugin.store.isSecretLocked("ttsApiKey")).toBe(true);
  });

  it("defaults geminiApiKey to an empty string and reports unlocked when nothing was persisted", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    expect(plugin.settings.geminiApiKey).toBe("");
    expect(plugin.store.isLocked()).toBe(false);
    expect(plugin.store.hasProtectedSecrets()).toBe(false);
  });

  it("adopts a plaintext key from a pre-encryption version", async () => {
    const { plugin } = makePlugin({ loadData: { geminiApiKey: "bare-plaintext-key" } });
    await plugin.loadSettings();
    expect(plugin.settings.geminiApiKey).toBe("bare-plaintext-key");
    expect(plugin.store.isLocked()).toBe(false);
  });

  it("discards a legacy enc:v1: key and explains that it must be re-entered", async () => {
    const { plugin } = makePlugin({ loadData: { geminiApiKey: "enc:v1:AAAABBBBCCCCDDDD" } });
    await plugin.loadSettings();
    expect(plugin.settings.geminiApiKey).toBe("");
    // Not "locked": no password can recover it, so the overlay must not appear.
    expect(plugin.store.isLocked()).toBe(false);
    expect(Notice.instances.some((n) => n.message.includes("älteren Version"))).toBe(true);
  });

  it("does not show any notice when no key was ever stored", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    expect(Notice.instances).toHaveLength(0);
  });
});

describe("RagChatPlugin.saveSettings", () => {
  it("asks for a new password and encrypts the key before persisting", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    const prompt = fakePrompt([PASSWORD]);
    plugin.store.setPasswordPrompt(prompt);

    plugin.settings.geminiApiKey = "plaintext-key";
    plugin.settings.topK = 10;
    await plugin.saveSettings();

    const persisted = persistedCalls(plugin)[0];
    expect(persisted.geminiApiKey.startsWith("enc:v2:")).toBe(true);
    expect(await decryptSecret(persisted.geminiApiKey, PASSWORD)).toBe("plaintext-key");
    expect(persisted.topK).toBe(10);
    // First secret ever: the user is asked to create a password, not to unlock.
    expect(prompt.requests[0].mode).toBe("create");
  });

  it("does not prompt at all when no secret changed", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    const prompt = fakePrompt([PASSWORD]);
    plugin.store.setPasswordPrompt(prompt);

    plugin.settings.topK = 12;
    await plugin.saveSettings();

    expect(prompt.requests).toHaveLength(0);
    expect(persistedCalls(plugin)[0].geminiApiKey).toBe("");
  });

  /**
   * The regression that lost the real vault's keys: an unrelated save (a
   * slider, or the TTS usage counter after every playback) used to re-encrypt
   * whatever was in memory - which is empty while locked - and overwrite the
   * stored ciphertext for good.
   */
  it("never touches a locked secret's ciphertext during an unrelated save", async () => {
    const encrypted = await encryptSecret("my-real-api-key", PASSWORD);
    const { plugin } = makePlugin({ loadData: { geminiApiKey: encrypted } });
    await plugin.loadSettings();
    const prompt = fakePrompt([]);
    plugin.store.setPasswordPrompt(prompt);

    plugin.settings.ttsCharCount = 1234;
    await plugin.saveSettings();

    const persisted = persistedCalls(plugin)[0];
    expect(persisted.geminiApiKey).toBe(encrypted);
    expect(prompt.requests).toHaveLength(0);
    expect(await decryptSecret(persisted.geminiApiKey, PASSWORD)).toBe("my-real-api-key");
  });

  it("reuses the previous ciphertext (no re-prompt) when an unlocked key is unchanged", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    const prompt = fakePrompt([PASSWORD]);
    plugin.store.setPasswordPrompt(prompt);

    plugin.settings.geminiApiKey = "plaintext-key";
    await plugin.saveSettings();
    const first = persistedCalls(plugin)[0].geminiApiKey;

    plugin.settings.topK = 12;
    await plugin.saveSettings();
    const second = persistedCalls(plugin)[1].geminiApiKey;

    expect(second).toBe(first);
    expect(prompt.requests).toHaveLength(1);
  });

  it("re-encrypts with fresh ciphertext when the key actually changes", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    plugin.store.setPasswordPrompt(fakePrompt([PASSWORD, PASSWORD]));

    plugin.settings.geminiApiKey = "first-key";
    await plugin.saveSettings();
    const first = persistedCalls(plugin)[0].geminiApiKey;

    plugin.settings.geminiApiKey = "second-key";
    await plugin.saveSettings();
    const second = persistedCalls(plugin)[1].geminiApiKey;

    expect(second).not.toBe(first);
    expect(await decryptSecret(second, PASSWORD)).toBe("second-key");
  });

  it("clears a secret without asking for a password", async () => {
    const encrypted = await encryptSecret("my-real-api-key", PASSWORD);
    const { plugin } = makePlugin({ loadData: { geminiApiKey: encrypted } });
    await plugin.loadSettings();
    await plugin.store.unlock(PASSWORD);
    const prompt = fakePrompt([]);
    plugin.store.setPasswordPrompt(prompt);

    plugin.settings.geminiApiKey = "";
    await plugin.saveSettings();

    expect(persistedCalls(plugin)[0].geminiApiKey).toBe("");
    expect(prompt.requests).toHaveLength(0);
    expect(plugin.store.hasProtectedSecrets()).toBe(false);
  });

  it("reverts the edit and keeps the old ciphertext when the password prompt is cancelled", async () => {
    const encrypted = await encryptSecret("my-real-api-key", PASSWORD);
    const { plugin } = makePlugin({ loadData: { geminiApiKey: encrypted } });
    await plugin.loadSettings();
    await plugin.store.unlock(PASSWORD);
    plugin.store.setPasswordPrompt(fakePrompt([null]));

    plugin.settings.geminiApiKey = "typed-but-not-confirmed";
    await plugin.saveSettings();

    const persisted = persistedCalls(plugin)[0];
    expect(persisted.geminiApiKey).toBe(encrypted);
    // Memory is put back in sync with disk instead of silently diverging.
    expect(plugin.settings.geminiApiKey).toBe("my-real-api-key");
    expect(Notice.instances.some((n) => n.message.includes("nicht gespeichert"))).toBe(true);
  });

  it("verifies a second secret's password against the first, re-prompting on a mismatch", async () => {
    const { plugin } = makePlugin({
      loadData: { geminiApiKey: await encryptSecret("gemini-key", PASSWORD) },
    });
    await plugin.loadSettings();
    await plugin.store.unlock(PASSWORD);
    // First attempt is a typo, second is right.
    const prompt = fakePrompt(["typo-password", PASSWORD]);
    plugin.store.setPasswordPrompt(prompt);

    plugin.settings.ttsApiKey = "tts-key";
    await plugin.saveSettings();

    expect(prompt.requests).toHaveLength(2);
    // A secret already exists, so this is an "unlock"-style prompt, and the
    // retry states why.
    expect(prompt.requests[0].mode).toBe("unlock");
    expect(prompt.requests[1].error).toContain("Falsches Passwort");

    const persisted = persistedCalls(plugin)[0];
    expect(await decryptSecret(persisted.ttsApiKey, PASSWORD)).toBe("tts-key");
    expect(await decryptSecret(persisted.geminiApiKey, PASSWORD)).toBe("gemini-key");
  });

  it("lets the user replace a still-locked secret by typing a new value", async () => {
    const { plugin } = makePlugin({
      loadData: { geminiApiKey: await encryptSecret("forgotten-key", "an-old-password") },
    });
    await plugin.loadSettings();
    expect(plugin.store.isSecretLocked("geminiApiKey")).toBe(true);
    plugin.store.setPasswordPrompt(fakePrompt(["brand-new-password"]));

    plugin.settings.geminiApiKey = "replacement-key";
    await plugin.saveSettings();

    const persisted = persistedCalls(plugin)[0];
    expect(await decryptSecret(persisted.geminiApiKey, "brand-new-password")).toBe("replacement-key");
    expect(plugin.store.isSecretLocked("geminiApiKey")).toBe(false);
  });

  it("does not persist a secret when no password prompt is wired up", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    plugin.store.setPasswordPrompt(null);

    plugin.settings.geminiApiKey = "plaintext-key";
    await plugin.saveSettings();

    expect(persistedCalls(plugin)[0].geminiApiKey).toBe("");
    expect(Notice.instances.some((n) => n.message.includes("keine Passwort-Eingabe"))).toBe(true);
  });

  it("protects a formerly-plaintext key on the next save", async () => {
    const { plugin } = makePlugin({ loadData: { geminiApiKey: "bare-plaintext-key" } });
    await plugin.loadSettings();
    plugin.store.setPasswordPrompt(fakePrompt([PASSWORD]));

    plugin.settings.geminiApiKey = "bare-plaintext-key-v2";
    await plugin.saveSettings();

    const persisted = persistedCalls(plugin)[0];
    expect(persisted.geminiApiKey.startsWith("enc:v2:")).toBe(true);
    expect(await decryptSecret(persisted.geminiApiKey, PASSWORD)).toBe("bare-plaintext-key-v2");
  });
});

describe("SettingsStore lock/unlock lifecycle", () => {
  it("lock() clears plaintext from memory but leaves the ciphertext on disk", async () => {
    const encrypted = await encryptSecret("my-real-api-key", PASSWORD);
    const { plugin } = makePlugin({ loadData: { geminiApiKey: encrypted } });
    await plugin.loadSettings();
    await plugin.store.unlock(PASSWORD);
    expect(plugin.settings.geminiApiKey).toBe("my-real-api-key");

    plugin.store.lock();
    expect(plugin.settings.geminiApiKey).toBe("");
    expect(plugin.store.isLocked()).toBe(true);

    // Still recoverable with the password.
    await plugin.store.unlock(PASSWORD);
    expect(plugin.settings.geminiApiKey).toBe("my-real-api-key");
  });

  it("notifies lock-state listeners on unlock and lock", async () => {
    const encrypted = await encryptSecret("my-real-api-key", PASSWORD);
    const { plugin } = makePlugin({ loadData: { geminiApiKey: encrypted } });
    await plugin.loadSettings();

    const listener = vi.fn();
    const unsubscribe = plugin.store.onLockStateChange(listener);
    await plugin.store.unlock(PASSWORD);
    expect(listener).toHaveBeenCalledTimes(1);
    plugin.store.lock();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    await plugin.store.unlock(PASSWORD);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("changePassword re-encrypts every secret under the new password", async () => {
    const { plugin } = makePlugin({
      loadData: {
        geminiApiKey: await encryptSecret("gemini-key", PASSWORD),
        ttsApiKey: await encryptSecret("tts-key", PASSWORD),
      },
    });
    await plugin.loadSettings();
    await plugin.store.unlock(PASSWORD);

    expect(await plugin.store.changePassword(PASSWORD, "new-password")).toBe(true);

    const persisted = persistedCalls(plugin).at(-1)!;
    expect(await decryptSecret(persisted.geminiApiKey, "new-password")).toBe("gemini-key");
    expect(await decryptSecret(persisted.ttsApiKey, "new-password")).toBe("tts-key");
    await expect(decryptSecret(persisted.geminiApiKey, PASSWORD)).rejects.toThrow();
  });

  it("changePassword refuses a wrong current password", async () => {
    const { plugin } = makePlugin({
      loadData: { geminiApiKey: await encryptSecret("gemini-key", PASSWORD) },
    });
    await plugin.loadSettings();
    await plugin.store.unlock(PASSWORD);

    expect(await plugin.store.changePassword("wrong", "new-password")).toBe(false);
    expect(plugin.saveData).not.toHaveBeenCalled();
  });

  it("changePassword refuses while any secret is still locked", async () => {
    const { plugin } = makePlugin({
      loadData: {
        geminiApiKey: await encryptSecret("gemini-key", PASSWORD),
        ttsApiKey: await encryptSecret("tts-key", "other-password"),
      },
    });
    await plugin.loadSettings();
    await plugin.store.unlock(PASSWORD);
    expect(plugin.store.isLocked()).toBe(true);

    expect(await plugin.store.changePassword(PASSWORD, "new-password")).toBe(false);
    expect(plugin.saveData).not.toHaveBeenCalled();
  });

  it("resetSecrets wipes every stored secret", async () => {
    const { plugin } = makePlugin({
      loadData: {
        geminiApiKey: await encryptSecret("gemini-key", PASSWORD),
        ttsApiKey: await encryptSecret("tts-key", PASSWORD),
      },
    });
    await plugin.loadSettings();

    await plugin.store.resetSecrets();

    const persisted = persistedCalls(plugin).at(-1)!;
    expect(persisted.geminiApiKey).toBe("");
    expect(persisted.ttsApiKey).toBe("");
    expect(plugin.store.hasProtectedSecrets()).toBe(false);
    expect(plugin.store.isLocked()).toBe(false);
  });
});
