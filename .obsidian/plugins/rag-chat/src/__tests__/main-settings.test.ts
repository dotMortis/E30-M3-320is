import { describe, expect, it, vi } from "vitest";
import { Notice } from "./mocks/obsidian";
import { encryptSecret } from "../secure-storage";
import { makePlugin } from "./main-harness";

describe("RagChatPlugin.loadSettings", () => {
  it("merges DEFAULT_SETTINGS with the persisted data", async () => {
    const { plugin } = makePlugin({ loadData: { topK: 12 } });
    await plugin.loadSettings();
    expect(plugin.settings.topK).toBe(12);
    expect(plugin.settings.embeddingModel).toBe("gemini-embedding-2");
  });

  it("decrypts a persisted encrypted API key into plaintext", async () => {
    const encrypted = await encryptSecret("my-real-api-key");
    const { plugin } = makePlugin({ loadData: { geminiApiKey: encrypted } });
    await plugin.loadSettings();
    expect(plugin.settings.geminiApiKey).toBe("my-real-api-key");
  });

  it("defaults geminiApiKey to an empty string when nothing was persisted", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    expect(plugin.settings.geminiApiKey).toBe("");
  });

  it("shows a Notice and clears the key when decryption fails on a non-empty stored value", async () => {
    const { plugin } = makePlugin({ loadData: { geminiApiKey: "garbage-not-encrypted-format" } });
    await plugin.loadSettings();
    expect(plugin.settings.geminiApiKey).toBe("");
    expect(Notice.instances.some((n) => n.message.includes("konnte nicht entschlüsselt werden"))).toBe(true);
  });

  it("does not show a decryption-failure Notice when no key was ever stored", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    expect(Notice.instances).toHaveLength(0);
  });
});

describe("RagChatPlugin.saveSettings", () => {
  it("encrypts geminiApiKey before persisting, leaving other fields as plaintext", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    plugin.settings.geminiApiKey = "plaintext-key";
    plugin.settings.topK = 10;
    await plugin.saveSettings();

    const persisted = (plugin.saveData as any).mock.calls[0][0];
    expect(persisted.geminiApiKey).not.toBe("plaintext-key");
    expect(persisted.geminiApiKey.startsWith("enc:v1:")).toBe(true);
    expect(persisted.topK).toBe(10);
  });

  it("reuses the previous ciphertext (skips re-encryption) when geminiApiKey is unchanged across saves", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    plugin.settings.geminiApiKey = "plaintext-key";
    await plugin.saveSettings();
    const firstCiphertext = (plugin.saveData as any).mock.calls[0][0].geminiApiKey;

    plugin.settings.topK = 12;
    await plugin.saveSettings();
    const secondCiphertext = (plugin.saveData as any).mock.calls[1][0].geminiApiKey;

    expect(secondCiphertext).toBe(firstCiphertext);
  });

  it("re-encrypts with fresh ciphertext when geminiApiKey actually changes", async () => {
    const { plugin } = makePlugin({ loadData: {} });
    await plugin.loadSettings();
    plugin.settings.geminiApiKey = "first-key";
    await plugin.saveSettings();
    const firstCiphertext = (plugin.saveData as any).mock.calls[0][0].geminiApiKey;

    plugin.settings.geminiApiKey = "second-key";
    await plugin.saveSettings();
    const secondCiphertext = (plugin.saveData as any).mock.calls[1][0].geminiApiKey;

    expect(secondCiphertext).not.toBe(firstCiphertext);
    const { decryptSecret } = await import("../secure-storage");
    expect(await decryptSecret(secondCiphertext)).toBe("second-key");
  });

  it("re-encrypts (does not persist stale ciphertext) after a load whose stored key failed to decrypt", async () => {
    const { plugin } = makePlugin({ loadData: { geminiApiKey: "garbage-not-encrypted-format" } });
    await plugin.loadSettings();
    plugin.settings.geminiApiKey = "new-real-key";
    await plugin.saveSettings();

    const persisted = (plugin.saveData as any).mock.calls[0][0];
    const { decryptSecret } = await import("../secure-storage");
    expect(await decryptSecret(persisted.geminiApiKey)).toBe("new-real-key");
  });
});

