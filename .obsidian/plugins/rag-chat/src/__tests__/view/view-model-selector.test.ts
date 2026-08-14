import { describe, expect, it, vi } from "vitest";
import { Notice } from "../mocks/obsidian";
import type { FakeElement } from "../mocks/dom";
import { listModelsResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import {
  DONE_RESULT,
  RAG_CHAT_VIEW_TYPE,
  answerQuestion,
  buildShortAnswer,
  confirmModal,
  continueAnswer,
  fake,
  getIndices,
  listOutputDevices,
  makeView,
  recordCharsUsed,
  synthesizeSpeech,
  ttsPlaybackMock,
} from "./harness";

describe("RagChatView", () => {
  describe("model selector", () => {
    function optionValues(select: FakeElement): string[] {
      return select.children.filter((c) => c.tag === "option").map((c) => c.attrs.value);
    }

    it("seeds the select with the currently configured model, and keeps it selected once the fetch resolves", async () => {
      const { view, plugin } = makeView();
      await view.onOpen();

      const select = fake(view.contentEl).querySelectorAll("select.rag-chat-model-select")[0];
      await vi.waitFor(() => {
        expect(optionValues(select)).toContain(plugin.settings.generationModel);
        expect(select.value).toBe(plugin.settings.generationModel);
      });
    });

    it("populates the select with flash models fetched from the API, keeping the current model selected", async () => {
      mockRequestUrlSequence([
        listModelsResponse([
          { name: "models/gemini-3.6-flash", displayName: "Gemini 3.6 Flash", supportedGenerationMethods: ["generateContent"] },
          { name: "models/gemini-2.5-flash", displayName: "Gemini 2.5 Flash", supportedGenerationMethods: ["generateContent"] },
        ]),
      ]);
      const { view, plugin } = makeView();
      await view.onOpen();

      const select = fake(view.contentEl).querySelectorAll("select.rag-chat-model-select")[0];
      await vi.waitFor(() => {
        expect(optionValues(select)).toEqual(["gemini-3.6-flash", "gemini-2.5-flash"]);
      });
      expect(select.value).toBe(plugin.settings.generationModel);
    });

    it("adds the current model to the fetched list when it is not already present", async () => {
      mockRequestUrlSequence([
        listModelsResponse([
          { name: "models/gemini-2.5-flash", displayName: "Gemini 2.5 Flash", supportedGenerationMethods: ["generateContent"] },
        ]),
      ]);
      const { view, plugin } = makeView();
      plugin.settings.generationModel = "gemini-3.6-flash-preview";
      await view.onOpen();

      const select = fake(view.contentEl).querySelectorAll("select.rag-chat-model-select")[0];
      await vi.waitFor(() => {
        expect(optionValues(select)).toContain("gemini-3.6-flash-preview");
      });
      expect(select.value).toBe("gemini-3.6-flash-preview");
    });

    it("updates and persists plugin.settings.generationModel when the select changes", async () => {
      mockRequestUrlSequence([
        listModelsResponse([
          { name: "models/gemini-3.6-flash", displayName: "Gemini 3.6 Flash", supportedGenerationMethods: ["generateContent"] },
          { name: "models/gemini-2.5-flash", displayName: "Gemini 2.5 Flash", supportedGenerationMethods: ["generateContent"] },
        ]),
      ]);
      const { view, plugin } = makeView();
      await view.onOpen();

      const select = fake(view.contentEl).querySelectorAll("select.rag-chat-model-select")[0];
      await vi.waitFor(() => expect(optionValues(select)).toContain("gemini-2.5-flash"));

      select.value = "gemini-2.5-flash";
      select.dispatch("change");

      await vi.waitFor(() => expect(plugin.settings.generationModel).toBe("gemini-2.5-flash"));
      expect(plugin.saveSettings).toHaveBeenCalled();
    });

    it("disables the model select and refresh button while a request is in flight", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestion.mockReturnValue(new Promise(() => {}));
      const { view } = makeView();
      await view.onOpen();
      await vi.waitFor(() => {
        const select = fake(view.contentEl).querySelectorAll("select.rag-chat-model-select")[0];
        expect(select.disabled).toBe(false);
      });

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const sendButton = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Frage?";
      sendButton.dispatch("click");

      await vi.waitFor(() => expect(sendButton.text).toBe("Abbrechen"));
      const select = fake(view.contentEl).querySelectorAll("select.rag-chat-model-select")[0];
      const refreshButton = fake(view.contentEl).querySelectorAll("button.rag-chat-model-refresh")[0];
      expect(select.disabled).toBe(true);
      expect(refreshButton.disabled).toBe(true);
    });

    it("re-fetches the model list when the refresh button is clicked", async () => {
      const { view } = makeView();
      await view.onOpen();
      await vi.waitFor(() => expect(requestUrl).toHaveBeenCalledTimes(1));

      mockRequestUrlSequence([
        listModelsResponse([
          { name: "models/gemini-3.6-flash", displayName: "Gemini 3.6 Flash", supportedGenerationMethods: ["generateContent"] },
        ]),
      ]);
      const refreshButton = fake(view.contentEl).querySelectorAll("button.rag-chat-model-refresh")[0];
      refreshButton.dispatch("click");

      const select = fake(view.contentEl).querySelectorAll("select.rag-chat-model-select")[0];
      await vi.waitFor(() => expect(optionValues(select)).toContain("gemini-3.6-flash"));
      expect(requestUrl).toHaveBeenCalledTimes(2);
    });
  });

});
