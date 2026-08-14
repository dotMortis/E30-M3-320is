import { describe, expect, it, vi } from "vitest";
import { DONE_RESULT, answerQuestion, fake, getIndices, makeView } from "./harness";


describe("RagChatView", () => {
  describe("retry and delete", () => {
    it("retries a failed message and renders the successful answer", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestion.mockRejectedValueOnce(new Error("boom"));
      const { view } = makeView();
      await view.onOpen();

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Frage?";
      button.dispatch("click");
      await vi.waitFor(() => {
        expect(fake(view.contentEl).querySelectorAll("button.rag-chat-retry-button")).toHaveLength(1);
      });

      answerQuestion.mockResolvedValueOnce(DONE_RESULT);
      const retryButton = fake(view.contentEl).querySelectorAll("button.rag-chat-retry-button")[0];
      retryButton.dispatch("click");

      await vi.waitFor(() => {
        const assistantText = fake(view.contentEl).querySelectorAll(".rag-chat-turn-text")[1];
        expect(assistantText?.text).toContain("30 Nm");
      });
      expect(answerQuestion).toHaveBeenCalledTimes(2);
    });

    it("deletes a failed message, restoring it to the textarea without resending", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestion.mockRejectedValueOnce(new Error("boom"));
      const { view } = makeView();
      await view.onOpen();

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Frage?";
      button.dispatch("click");
      await vi.waitFor(() => {
        expect(fake(view.contentEl).querySelectorAll("button.rag-chat-delete-button")).toHaveLength(1);
      });

      const deleteButton = fake(view.contentEl).querySelectorAll("button.rag-chat-delete-button")[0];
      deleteButton.dispatch("click");

      expect(input.value).toBe("Frage?");
      expect(fake(view.contentEl).querySelectorAll(".rag-chat-turn")).toHaveLength(0);
      expect(answerQuestion).toHaveBeenCalledTimes(1);
    });
  });
});
