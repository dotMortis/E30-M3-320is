import { describe, expect, it, vi } from "vitest";
import { answerQuestion, fake, makeView } from "./harness";

function overlay(view: { contentEl: unknown }) {
  return fake(view.contentEl as never).querySelectorAll(".rag-chat-lock-overlay")[0];
}

describe("RagChatView lock overlay", () => {
  it("stays hidden when nothing is locked", async () => {
    const { view } = makeView();
    await view.onOpen();
    expect(overlay(view).classes.has("rag-chat-hidden")).toBe(true);
    expect(fake(view.contentEl).classes.has("is-locked")).toBe(false);
  });

  it("covers the chat when secrets are locked on open", async () => {
    const { view, plugin } = makeView();
    plugin.isLocked.mockReturnValue(true);
    await view.onOpen();
    expect(overlay(view).classes.has("rag-chat-hidden")).toBe(false);
    expect(fake(view.contentEl).classes.has("is-locked")).toBe(true);
  });

  it("shows an unlock affordance the user can click", async () => {
    const { view, plugin } = makeView();
    plugin.isLocked.mockReturnValue(true);
    await view.onOpen();

    const button = overlay(view).querySelectorAll("button.rag-chat-lock-overlay-button")[0];
    expect(button.text).toContain("Entsperren");
  });

  it("asks the plugin to unlock when clicked and hides itself on success", async () => {
    const { view, plugin } = makeView();
    plugin.isLocked.mockReturnValue(true);
    await view.onOpen();

    plugin.promptUnlock.mockImplementation(async () => {
      plugin.isLocked.mockReturnValue(false);
      return true;
    });
    overlay(view).dispatch("click");

    await vi.waitFor(() => {
      expect(plugin.promptUnlock).toHaveBeenCalledTimes(1);
      expect(overlay(view).classes.has("rag-chat-hidden")).toBe(true);
    });
  });

  it("stays visible when the unlock prompt is dismissed", async () => {
    const { view, plugin } = makeView();
    plugin.isLocked.mockReturnValue(true);
    await view.onOpen();

    plugin.promptUnlock.mockResolvedValue(false);
    overlay(view).dispatch("click");

    await vi.waitFor(() => expect(plugin.promptUnlock).toHaveBeenCalledTimes(1));
    expect(overlay(view).classes.has("rag-chat-hidden")).toBe(false);
  });

  it("reacts to the plugin pushing a lock-state change", async () => {
    const { view } = makeView();
    await view.onOpen();
    expect(overlay(view).classes.has("rag-chat-hidden")).toBe(true);

    view.setLocked(true);
    expect(overlay(view).classes.has("rag-chat-hidden")).toBe(false);

    view.setLocked(false);
    expect(overlay(view).classes.has("rag-chat-hidden")).toBe(true);
  });
});

describe("RagChatView while locked", () => {
  it("refuses to start a recording and offers to unlock instead", async () => {
    const { view, plugin } = makeView();
    plugin.isLocked.mockReturnValue(true);
    await view.onOpen();

    expect(view.startVoiceRecording("hotkey")).toBe(false);
    await vi.waitFor(() => expect(plugin.promptUnlock).toHaveBeenCalledTimes(1));
  });

  it("refuses to send a message and offers to unlock instead", async () => {
    const { view, plugin } = makeView();
    plugin.isLocked.mockReturnValue(true);
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Wie viel Nm?";
    button.dispatch("click");

    await vi.waitFor(() => expect(plugin.promptUnlock).toHaveBeenCalledTimes(1));
    expect(answerQuestion).not.toHaveBeenCalled();
  });
});
