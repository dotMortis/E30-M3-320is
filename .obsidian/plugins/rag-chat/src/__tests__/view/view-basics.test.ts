import { describe, expect, it, vi } from "vitest";
import { Notice } from "../mocks/obsidian";
import { DONE_RESULT, RAG_CHAT_VIEW_TYPE, answerQuestion, fake, getIndices, makeView } from "./harness";


describe("RagChatView", () => {
  it("reports its view type, display text, and icon", () => {
    const { view } = makeView();
    expect(view.getViewType()).toBe(RAG_CHAT_VIEW_TYPE);
    expect(view.getDisplayText()).toBe("RAG Chat");
    expect(view.getIcon()).toBe("message-circle-question");
  });

  it("builds the input row and message list on open", async () => {
    const { view } = makeView();
    await view.onOpen();
    expect(fake(view.contentEl).classes.has("rag-chat-container")).toBe(true);
    expect(fake(view.contentEl).querySelectorAll(".rag-chat-messages")).toHaveLength(1);
    expect(fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")).toHaveLength(1);
    expect(fake(view.contentEl).querySelectorAll("button.rag-chat-send")).toHaveLength(1);
  });

  it("sends a message on send-button click and renders the assistant's answer", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    answerQuestion.mockResolvedValue(DONE_RESULT);
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Wie viel Nm für die Zylinderkopfschrauben?";
    button.dispatch("click");

    await vi.waitFor(() => {
      const assistantText = fake(view.contentEl).querySelectorAll(".rag-chat-turn-text")[1];
      expect(assistantText?.text).toContain("30 Nm");
    });
  });

  it("sends a message on Enter (without Shift) in the textarea", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    answerQuestion.mockResolvedValue(DONE_RESULT);
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    input.value = "Frage?";
    const preventDefault = vi.fn();
    input.dispatch("keydown", { key: "Enter", shiftKey: false, preventDefault });

    await vi.waitFor(() => {
      expect(answerQuestion).toHaveBeenCalled();
    });
    expect(preventDefault).toHaveBeenCalled();
  });

  it("does not send on Shift+Enter (allows multi-line input)", async () => {
    const { view } = makeView();
    await view.onOpen();
    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    input.value = "Frage?";
    input.dispatch("keydown", { key: "Enter", shiftKey: true, preventDefault: vi.fn() });
    expect(answerQuestion).not.toHaveBeenCalled();
  });

  it("does nothing when the input is empty", async () => {
    const { view } = makeView();
    await view.onOpen();
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    button.dispatch("click");
    expect(answerQuestion).not.toHaveBeenCalled();
  });

  it("shows Abbrechen on the send button while a request is in flight, then Fragen again after", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    let resolveAnswer!: (v: typeof DONE_RESULT) => void;
    answerQuestion.mockReturnValue(new Promise((resolve) => (resolveAnswer = resolve)));
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Frage?";
    button.dispatch("click");

    await vi.waitFor(() => expect(button.text).toBe("Abbrechen"));
    expect(button.disabled).toBe(false);

    resolveAnswer(DONE_RESULT);
    await vi.waitFor(() => expect(button.text).toBe("Fragen"));
  });

  it("shows a Notice and an error turn when the workflow throws", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    answerQuestion.mockRejectedValue(new Error("Google API key is required"));
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Frage?";
    button.dispatch("click");

    await vi.waitFor(() => {
      expect(Notice.instances.length).toBeGreaterThan(0);
    });
    expect(Notice.instances[0].message).toContain("Google API key is required");

    const assistantText = fake(view.contentEl).querySelectorAll(".rag-chat-turn-text")[1];
    expect(assistantText.text).toContain("Fehler:");
  });
});
