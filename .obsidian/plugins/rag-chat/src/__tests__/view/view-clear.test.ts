import { describe, expect, it, vi } from "vitest";
import { DONE_RESULT, answerQuestion, confirmModal, fake, getIndices, makeView } from "./harness";


describe("RagChatView", () => {
  describe("clearChat", () => {
    it("resets the conversation to empty and re-renders", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestion.mockResolvedValue(DONE_RESULT);
      const { view } = makeView();
      await view.onOpen();

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Frage?";
      button.dispatch("click");
      await vi.waitFor(() => {
        expect(fake(view.contentEl).querySelectorAll(".rag-chat-turn")).toHaveLength(2);
      });

      view.clearChat();
      expect(fake(view.contentEl).querySelectorAll(".rag-chat-turn")).toHaveLength(0);
    });

    it("hides the cancel-clarification affordance after clearing a pending clarification", async () => {
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

      view.clearChat();
      const cancelButton = fake(view.contentEl).querySelectorAll(".rag-chat-cancel-clarification")[0];
      expect(cancelButton.classes.has("rag-chat-hidden")).toBe(true);
    });
  });

  describe("clear-chat button", () => {
    it("clears the conversation when the confirm dialog is accepted", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestion.mockResolvedValue(DONE_RESULT);
      confirmModal.mockResolvedValue(true);
      const { view } = makeView();
      await view.onOpen();

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const sendButton = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Frage?";
      sendButton.dispatch("click");
      await vi.waitFor(() => {
        expect(fake(view.contentEl).querySelectorAll(".rag-chat-turn")).toHaveLength(2);
      });

      const clearButton = fake(view.contentEl).querySelectorAll("button.rag-chat-clear-button")[0];
      clearButton.dispatch("click");

      await vi.waitFor(() => {
        expect(fake(view.contentEl).querySelectorAll(".rag-chat-turn")).toHaveLength(0);
      });
    });

    it("does not clear the conversation when the confirm dialog is dismissed", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestion.mockResolvedValue(DONE_RESULT);
      confirmModal.mockResolvedValue(false);
      const { view } = makeView();
      await view.onOpen();

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const sendButton = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Frage?";
      sendButton.dispatch("click");
      await vi.waitFor(() => {
        expect(fake(view.contentEl).querySelectorAll(".rag-chat-turn")).toHaveLength(2);
      });

      const clearButton = fake(view.contentEl).querySelectorAll("button.rag-chat-clear-button")[0];
      clearButton.dispatch("click");
      await vi.waitFor(() => expect(confirmModal).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fake(view.contentEl).querySelectorAll(".rag-chat-turn")).toHaveLength(2);
    });
  });

});
