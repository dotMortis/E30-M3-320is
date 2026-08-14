import { describe, expect, it, vi } from "vitest";
import { Notice } from "../mocks/obsidian";
import { DONE_RESULT, answerQuestion, continueAnswer, fake, getIndices, makeView } from "./harness";

describe("RagChatView", () => {
  it("clears the input textarea immediately after sending", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    answerQuestion.mockResolvedValue(DONE_RESULT);
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Frage?";
    button.dispatch("click");

    expect(input.value).toBe("");
  });

  it("empties the content element on close", async () => {
    const { view } = makeView();
    await view.onOpen();
    await view.onClose();
    expect(fake(view.contentEl).children).toHaveLength(0);
  });

  it("shows the cancel-clarification affordance only while a clarification is pending", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    answerQuestion.mockResolvedValue({
      status: "awaiting_clarification",
      question: "Welches Baujahr?",
      pending: { state: {}, ctx: {} },
    });
    const { view } = makeView();
    await view.onOpen();

    const cancelButton = fake(view.contentEl).querySelectorAll(".rag-chat-cancel-clarification")[0];
    expect(cancelButton.classes.has("rag-chat-hidden")).toBe(true);

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Frage?";
    button.dispatch("click");

    await vi.waitFor(() => {
      expect(cancelButton.classes.has("rag-chat-hidden")).toBe(false);
    });
  });

  it("clicking cancel-clarification abandons the pending state and routes the next message to answerQuestion", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    answerQuestion.mockResolvedValue({
      status: "awaiting_clarification",
      question: "Welches Baujahr?",
      pending: { state: {}, ctx: {} },
    });
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Frage?";
    button.dispatch("click");
    await vi.waitFor(() => {
      const cancelButton = fake(view.contentEl).querySelectorAll(".rag-chat-cancel-clarification")[0];
      expect(cancelButton.classes.has("rag-chat-hidden")).toBe(false);
    });

    const cancelButton = fake(view.contentEl).querySelectorAll(".rag-chat-cancel-clarification")[0];
    cancelButton.dispatch("click");
    expect(cancelButton.classes.has("rag-chat-hidden")).toBe(true);

    answerQuestion.mockResolvedValue(DONE_RESULT);
    input.value = "Unabhängige neue Frage";
    button.dispatch("click");
    await vi.waitFor(() => expect(answerQuestion).toHaveBeenCalledTimes(2));
    expect(continueAnswer).not.toHaveBeenCalled();
  });

  it("does not show a Notice for an error that settles after the view was closed", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    let rejectAnswer!: (err: Error) => void;
    answerQuestion.mockReturnValue(new Promise((_, reject) => (rejectAnswer = reject)));
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Frage?";
    button.dispatch("click");

    await view.onClose();
    rejectAnswer(new Error("late failure after close"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(Notice.instances).toHaveLength(0);
  });

  it("aborts the in-flight request's AbortSignal on close", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    let capturedSignal: AbortSignal | undefined;
    answerQuestion.mockImplementation(async ({ signal }: { signal?: AbortSignal }) => {
      capturedSignal = signal;
      return new Promise(() => {});
    });
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Frage?";
    button.dispatch("click");

    await vi.waitFor(() => expect(capturedSignal).toBeDefined());
    expect(capturedSignal!.aborted).toBe(false);
    await view.onClose();
    expect(capturedSignal!.aborted).toBe(true);
  });

  it("aborts the in-flight request's AbortSignal on unload", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    let capturedSignal: AbortSignal | undefined;
    answerQuestion.mockImplementation(async ({ signal }: { signal?: AbortSignal }) => {
      capturedSignal = signal;
      return new Promise(() => {});
    });
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Frage?";
    button.dispatch("click");

    await vi.waitFor(() => expect(capturedSignal).toBeDefined());
    view.onunload();
    expect(capturedSignal!.aborted).toBe(true);
  });
});
