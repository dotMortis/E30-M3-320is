import { describe, expect, it, vi } from "vitest";
import { Notice } from "../mocks/obsidian";
import { answerQuestion, confirmModal, fake, getIndices, makeView } from "./harness";


describe("RagChatView", () => {
  describe("cancel button", () => {
    it("shows a confirm dialog and, when accepted, aborts the request and reverts the turns and input", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestion.mockImplementation(({ signal }: { signal?: AbortSignal }) => {
        return new Promise((_, reject) => {
          signal?.addEventListener("abort", () => reject(new Error("Anfrage abgebrochen.")));
        });
      });
      confirmModal.mockResolvedValue(true);
      const { view } = makeView();
      await view.onOpen();

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Wie viel Nm für die Zylinderkopfschrauben?";
      button.dispatch("click");

      await vi.waitFor(() => expect(answerQuestion).toHaveBeenCalled());
      button.dispatch("click");

      await vi.waitFor(() => {
        expect(fake(view.contentEl).querySelectorAll(".rag-chat-turn")).toHaveLength(0);
      });
      expect(input.value).toBe("Wie viel Nm für die Zylinderkopfschrauben?");
      expect(button.text).toBe("Fragen");
      expect(Notice.instances.some((n) => n.message.includes("abgebrochen"))).toBe(true);
    });

    it("does not abort the request when the confirm dialog is dismissed", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      let capturedSignal: AbortSignal | undefined;
      answerQuestion.mockImplementation(({ signal }: { signal?: AbortSignal }) => {
        capturedSignal = signal;
        return new Promise(() => {});
      });
      confirmModal.mockResolvedValue(false);
      const { view } = makeView();
      await view.onOpen();

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Frage?";
      button.dispatch("click");

      await vi.waitFor(() => expect(capturedSignal).toBeDefined());
      button.dispatch("click");
      await vi.waitFor(() => expect(confirmModal).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(capturedSignal!.aborted).toBe(false);
      expect(fake(view.contentEl).querySelectorAll(".rag-chat-turn")).toHaveLength(2);
    });
  });

});
