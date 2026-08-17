import { describe, expect, it, vi } from "vitest";
import { Modal, Notice, type Plugin as MockPlugin } from "./mocks/obsidian";
import type { FakeElement } from "./mocks/dom";
import { encryptSecret } from "../secure-storage";
import { fakeManifest } from "./fixtures/manifest";
import { makePlugin } from "./main-harness";

const PASSWORD = "vault-password";

function withManifest(loadData: unknown) {
  return makePlugin({
    loadData,
    adapterFiles: {
      ".obsidian/plugins/rag-chat/rag-manifest.json": JSON.stringify(fakeManifest()),
    },
  });
}

/** Types `password` into the newest password modal and confirms/cancels it. */
function submitModal(password: string | null): void {
  const contentEl = Modal.instances.at(-1)!.contentEl as unknown as FakeElement;
  const buttons = contentEl.querySelectorAll("button");
  if (password === null) {
    buttons.find((b) => b.text === "Abbrechen")!.dispatch("click");
    return;
  }
  for (const input of contentEl.querySelectorAll("input")) input.value = password;
  buttons.find((b) => b.text !== "Abbrechen")!.dispatch("click");
}

describe("RagChatPlugin secret commands", () => {
  it("registers the unlock and lock commands", async () => {
    const { plugin } = withManifest({});
    await plugin.onload();
    const ids = (plugin as unknown as MockPlugin).commands.map((c) => c.id);
    expect(ids).toContain("rag-chat-unlock-secrets");
    expect(ids).toContain("rag-chat-lock-secrets");
  });

  it("the lock command clears the in-memory key", async () => {
    const { plugin } = withManifest({ geminiApiKey: await encryptSecret("real-key", PASSWORD) });
    await plugin.onload();
    // The startup prompt opened a modal; answer it to get into the unlocked state.
    submitModal(PASSWORD);
    await vi.waitFor(() => expect(plugin.settings.geminiApiKey).toBe("real-key"));

    const command = (plugin as unknown as MockPlugin).commands.find(
      (c) => c.id === "rag-chat-lock-secrets",
    )!;
    command.callback();

    expect(plugin.settings.geminiApiKey).toBe("");
    expect(plugin.isLocked()).toBe(true);
  });

  it("the lock command explains when there is nothing to lock", async () => {
    const { plugin } = withManifest({});
    await plugin.onload();
    const command = (plugin as unknown as MockPlugin).commands.find(
      (c) => c.id === "rag-chat-lock-secrets",
    )!;
    command.callback();
    expect(Notice.instances.some((n) => n.message.includes("Keine gespeicherten Secrets"))).toBe(true);
  });
});

describe("RagChatPlugin.promptUnlock", () => {
  it("prompts on startup when an encrypted key is stored, and unlocks it", async () => {
    const { plugin } = withManifest({ geminiApiKey: await encryptSecret("real-key", PASSWORD) });
    await plugin.onload();

    // onLayoutReady fires synchronously in the fake workspace, so the startup
    // prompt is already open here.
    expect(Modal.instances).toHaveLength(1);
    submitModal(PASSWORD);

    await vi.waitFor(() => {
      expect(plugin.settings.geminiApiKey).toBe("real-key");
      expect(plugin.isLocked()).toBe(false);
    });
  });

  it("does not prompt on startup when nothing is stored", async () => {
    const { plugin } = withManifest({});
    await plugin.onload();
    expect(Modal.instances).toHaveLength(0);
  });

  it("re-prompts on a wrong password until the right one is entered", async () => {
    const { plugin } = withManifest({ geminiApiKey: await encryptSecret("real-key", PASSWORD) });
    await plugin.onload();

    submitModal("wrong-password");
    await vi.waitFor(() => expect(Modal.instances).toHaveLength(2));
    // The retry says why it re-opened.
    const retryEl = Modal.instances[1].contentEl as unknown as FakeElement;
    expect(retryEl.querySelectorAll(".rag-chat-password-modal-error")[0]?.text).toContain(
      "Falsches Passwort",
    );

    submitModal(PASSWORD);
    await vi.waitFor(() => expect(plugin.settings.geminiApiKey).toBe("real-key"));
  });

  it("leaves secrets locked when the prompt is cancelled", async () => {
    const { plugin } = withManifest({ geminiApiKey: await encryptSecret("real-key", PASSWORD) });
    await plugin.onload();

    submitModal(null);

    await vi.waitFor(() => expect(Modal.instances).toHaveLength(1));
    expect(plugin.settings.geminiApiKey).toBe("");
    expect(plugin.isLocked()).toBe(true);
  });

  it("resolves immediately (no modal) when nothing is locked", async () => {
    const { plugin } = withManifest({});
    await plugin.onload();
    await expect(plugin.promptUnlock()).resolves.toBe(true);
    expect(Modal.instances).toHaveLength(0);
  });

  it("does not stack modals when unlock is requested twice concurrently", async () => {
    const { plugin } = withManifest({ geminiApiKey: await encryptSecret("real-key", PASSWORD) });
    await plugin.onload();
    expect(Modal.instances).toHaveLength(1);

    // A second request (overlay click / command) while the first is open.
    const second = plugin.promptUnlock();
    expect(Modal.instances).toHaveLength(1);
    await expect(second).resolves.toBe(false);

    submitModal(PASSWORD);
    await vi.waitFor(() => expect(plugin.settings.geminiApiKey).toBe("real-key"));
  });

  it("reports secrets that the entered password could not unlock", async () => {
    const { plugin } = withManifest({
      geminiApiKey: await encryptSecret("gemini-key", PASSWORD),
      ttsApiKey: await encryptSecret("tts-key", "some-other-password"),
    });
    await plugin.onload();

    submitModal(PASSWORD);

    await vi.waitFor(() => {
      expect(plugin.settings.geminiApiKey).toBe("gemini-key");
      expect(Notice.instances.some((n) => n.message.includes("TTS API-Key"))).toBe(true);
    });
    expect(plugin.settings.ttsApiKey).toBe("");
  });
});
