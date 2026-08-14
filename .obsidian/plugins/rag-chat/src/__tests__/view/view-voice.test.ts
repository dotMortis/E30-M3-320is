import { describe, expect, it, vi } from "vitest";
import {
  DONE_RESULT,
  answerQuestion,
  buildShortAnswer,
  fake,
  getIndices,
  makeView,
  recordCharsUsed,
  synthesizeSpeech,
  ttsPlaybackMock,
} from "./harness";

describe("RagChatView", () => {
  describe("voice output (TTS)", () => {
    it("renders an unchecked voice checkbox with the TTS controls row hidden by default", async () => {
      const { view } = makeView();
      await view.onOpen();

      const checkbox = fake(view.contentEl).querySelectorAll("input.rag-chat-tts-checkbox")[0] as any;
      expect(checkbox).toBeDefined();
      expect(checkbox.checked).toBe(false);

      const controlsRow = fake(view.contentEl).querySelectorAll(".rag-chat-tts-controls")[0];
      expect(controlsRow.classes.has("rag-chat-hidden")).toBe(true);
    });

    it("renders the TTS controls row as a collapsed-by-default <details> element", async () => {
      const { view } = makeView();
      await view.onOpen();

      const controlsRow = fake(view.contentEl).querySelectorAll(".rag-chat-tts-controls")[0];
      expect(controlsRow.tag).toBe("details");
      expect(controlsRow.getAttribute("open")).toBeNull();
      expect(controlsRow.querySelectorAll(".rag-chat-tts-controls-summary")).toHaveLength(1);
    });

    it("toggling the voice checkbox persists settings.ttsEnabled and shows/hides the controls row", async () => {
      const { view, plugin } = makeView();
      await view.onOpen();

      const checkbox = fake(view.contentEl).querySelectorAll("input.rag-chat-tts-checkbox")[0] as any;
      const controlsRow = fake(view.contentEl).querySelectorAll(".rag-chat-tts-controls")[0];

      checkbox.checked = true;
      checkbox.dispatch("change");

      expect(plugin.settings.ttsEnabled).toBe(true);
      expect(plugin.saveSettings).toHaveBeenCalled();
      expect(controlsRow.classes.has("rag-chat-hidden")).toBe(false);
    });

    it("runs the short-answer -> synthesize -> play pipeline after a successful answer when voice output is enabled", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestion.mockResolvedValue(DONE_RESULT);
      buildShortAnswer.mockResolvedValue("30 Nm.");
      synthesizeSpeech.mockResolvedValue("base64audio");

      const { view, plugin } = makeView();
      plugin.settings.ttsEnabled = true;
      await view.onOpen();

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Frage?";
      button.dispatch("click");

      await vi.waitFor(() => expect(synthesizeSpeech).toHaveBeenCalledTimes(1));
      expect(buildShortAnswer).toHaveBeenCalledWith(DONE_RESULT.text, plugin.settings, expect.anything());
      expect(recordCharsUsed).toHaveBeenCalledWith(plugin, "30 Nm.".length);
      await vi.waitFor(() =>
        expect(ttsPlaybackMock.play).toHaveBeenCalledWith(
          "base64audio",
          expect.objectContaining({ deviceId: plugin.settings.ttsOutputDeviceId, volume: plugin.settings.ttsVolume })
        )
      );
    });

    it("does not run the TTS pipeline when voice output is disabled", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestion.mockResolvedValue(DONE_RESULT);
      const { view } = makeView();
      await view.onOpen();

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Frage?";
      button.dispatch("click");

      await vi.waitFor(() => expect(answerQuestion).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(buildShortAnswer).not.toHaveBeenCalled();
    });

    it("does not run the TTS pipeline for an awaiting_clarification result even when voice output is enabled", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestion.mockResolvedValue({
        status: "awaiting_clarification",
        question: "Welches Baujahr?",
        pending: { state: {}, ctx: {} },
      });
      const { view, plugin } = makeView();
      plugin.settings.ttsEnabled = true;
      await view.onOpen();

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Frage?";
      button.dispatch("click");

      await vi.waitFor(() => expect(answerQuestion).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(buildShortAnswer).not.toHaveBeenCalled();
    });

    it("starts synthesizing speech as soon as the model streams a short answer, before the turn is done", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      synthesizeSpeech.mockResolvedValue("base64audio");
      answerQuestion.mockImplementation(async (params: any) => {
        params.onShortAnswerReady?.("Kurze Antwort.");
        return { ...DONE_RESULT, shortAnswer: "Kurze Antwort." };
      });

      const { view, plugin } = makeView();
      plugin.settings.ttsEnabled = true;
      await view.onOpen();

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Frage?";
      button.dispatch("click");

      await vi.waitFor(() =>
        expect(synthesizeSpeech).toHaveBeenCalledWith("Kurze Antwort.", plugin.settings, expect.anything())
      );
      await vi.waitFor(() => expect(ttsPlaybackMock.play).toHaveBeenCalledWith("base64audio", expect.anything()));
      expect(buildShortAnswer).not.toHaveBeenCalled();
      expect(synthesizeSpeech).toHaveBeenCalledTimes(1);
    });

    it("replays cached audio on a second speaker-button click without re-synthesizing", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestion.mockResolvedValue(DONE_RESULT);
      buildShortAnswer.mockResolvedValue("30 Nm.");
      synthesizeSpeech.mockResolvedValue("base64audio");

      const { view, plugin } = makeView();
      plugin.settings.ttsEnabled = true;
      await view.onOpen();

      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      input.value = "Frage?";
      button.dispatch("click");

      await vi.waitFor(() => expect(synthesizeSpeech).toHaveBeenCalledTimes(1));
      await vi.waitFor(() => expect(ttsPlaybackMock.setOnEnded).toHaveBeenCalled());

      const onEnded = ttsPlaybackMock.setOnEnded.mock.calls.at(-1)![0] as () => void;
      onEnded();

      ttsPlaybackMock.play.mockClear();
      const speakButton = fake(view.contentEl).querySelectorAll("button.rag-chat-tts-button")[0];
      speakButton.dispatch("click");

      await vi.waitFor(() => expect(ttsPlaybackMock.play).toHaveBeenCalledTimes(1));
      expect(synthesizeSpeech).toHaveBeenCalledTimes(1);
      expect(recordCharsUsed).toHaveBeenCalledTimes(1);
    });
  });
});
