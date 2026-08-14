import { afterEach, describe, expect, it, vi } from "vitest";
import { Notice } from "../mocks/obsidian";
import {
  DONE_RESULT,
  answerQuestion,
  answerQuestionFromAudio,
  blobToWavBase64,
  buildShortAnswer,
  fake,
  getIndices,
  makeView,
  micRecorderStart,
  micRecorderStop,
  recordCharsUsed,
  synthesizeSpeech,
  ttsPlaybackMock,
} from "./harness";

// Note: the Date.now() spy is intentionally left in place after this returns (restored via
// afterEach below) since stopVoiceRecordingAndSend() reads Date.now() asynchronously, after the
// mouseup handler's synchronous dispatch has already returned.
function pressAndHold(button: ReturnType<typeof fake>, holdMs: number): void {
  const nowSpy = vi.spyOn(Date, "now");
  nowSpy.mockReturnValue(1_700_000_000_000);
  button.dispatch("mousedown", { preventDefault: vi.fn() });
  nowSpy.mockReturnValue(1_700_000_000_000 + holdMs);
  button.dispatch("mouseup", { preventDefault: vi.fn() });
}

describe("RagChatView", () => {
  describe("voice input (push-to-talk mic button)", () => {
    afterEach(() => {
      // Only restore Date.now (spied on by pressAndHold) - other module-level mocks in
      // ./harness carry default implementations that must survive across tests in this file.
      if (vi.isMockFunction(Date.now)) (Date.now as unknown as { mockRestore: () => void }).mockRestore();
    });

    it("renders a mic button in the composer controls", async () => {
      const { view } = makeView();
      await view.onOpen();
      const micButton = fake(view.contentEl).querySelectorAll("button.rag-chat-mic-button")[0];
      expect(micButton).toBeDefined();
    });

    it("starts recording on mousedown and marks the button as recording", async () => {
      const { view } = makeView();
      await view.onOpen();
      const micButton = fake(view.contentEl).querySelectorAll("button.rag-chat-mic-button")[0];

      micButton.dispatch("mousedown", { preventDefault: vi.fn() });

      expect(micRecorderStart).toHaveBeenCalledTimes(1);
      expect(micButton.classes.has("is-recording")).toBe(true);
    });

    it("sends the recorded audio straight to answerQuestionFromAudio on mouseup", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestionFromAudio.mockImplementation(async (params: any) => {
        params.onTranscriptReady?.("Anzugsdrehmoment?");
        return DONE_RESULT;
      });

      const { view } = makeView();
      await view.onOpen();
      const micButton = fake(view.contentEl).querySelectorAll("button.rag-chat-mic-button")[0];

      pressAndHold(micButton, 500);

      await vi.waitFor(() => expect(micRecorderStop).toHaveBeenCalledTimes(1));
      await vi.waitFor(() => expect(blobToWavBase64).toHaveBeenCalledTimes(1));
      await vi.waitFor(() => expect(answerQuestionFromAudio).toHaveBeenCalledTimes(1));
      expect(answerQuestionFromAudio.mock.calls[0][0].base64Audio).toBe("QUJD");
      expect(answerQuestionFromAudio.mock.calls[0][0].mimeType).toBe("audio/wav");
      expect(answerQuestion).not.toHaveBeenCalled();

      await vi.waitFor(() => expect(micButton.classes.has("is-recording")).toBe(false));
    });

    it("forces TTS playback for the reply even when Sprachausgabe is disabled", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestionFromAudio.mockResolvedValue(DONE_RESULT);
      buildShortAnswer.mockResolvedValue("30 Nm.");
      synthesizeSpeech.mockResolvedValue("base64audio");

      const { view, plugin } = makeView();
      expect(plugin.settings.ttsEnabled).toBe(false);
      await view.onOpen();
      const micButton = fake(view.contentEl).querySelectorAll("button.rag-chat-mic-button")[0];

      pressAndHold(micButton, 500);

      await vi.waitFor(() => expect(synthesizeSpeech).toHaveBeenCalledTimes(1));
      await vi.waitFor(() =>
        expect(ttsPlaybackMock.play).toHaveBeenCalledWith(
          "base64audio",
          expect.objectContaining({ deviceId: plugin.settings.ttsOutputDeviceId, volume: plugin.settings.ttsVolume }),
        ),
      );
      expect(recordCharsUsed).toHaveBeenCalledWith(plugin, "30 Nm.".length);
      expect(plugin.settings.ttsEnabled).toBe(false);
    });

    it("speaks the AI's clarifying follow-up question via TTS even when Sprachausgabe is disabled", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      const pending = { state: {}, ctx: {} } as any;
      answerQuestionFromAudio.mockResolvedValue({
        status: "awaiting_clarification",
        question: "Welches Baujahr?",
        pending,
      });
      buildShortAnswer.mockResolvedValue("Welches Baujahr?");
      synthesizeSpeech.mockResolvedValue("base64audio");

      const { view, plugin } = makeView();
      expect(plugin.settings.ttsEnabled).toBe(false);
      await view.onOpen();
      const micButton = fake(view.contentEl).querySelectorAll("button.rag-chat-mic-button")[0];

      pressAndHold(micButton, 500);

      await vi.waitFor(() => expect(synthesizeSpeech).toHaveBeenCalledWith("Welches Baujahr?", plugin.settings, expect.anything()));
      await vi.waitFor(() =>
        expect(ttsPlaybackMock.play).toHaveBeenCalledWith(
          "base64audio",
          expect.objectContaining({ deviceId: plugin.settings.ttsOutputDeviceId, volume: plugin.settings.ttsVolume }),
        ),
      );
      expect(plugin.settings.ttsEnabled).toBe(false);
    });

    it("ignores a very short accidental press below the minimum recording duration", async () => {
      const { view } = makeView();
      await view.onOpen();
      const micButton = fake(view.contentEl).querySelectorAll("button.rag-chat-mic-button")[0];

      pressAndHold(micButton, 10);

      await vi.waitFor(() => expect(micRecorderStop).toHaveBeenCalledTimes(1));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(blobToWavBase64).not.toHaveBeenCalled();
      expect(answerQuestionFromAudio).not.toHaveBeenCalled();
    });

    it("does not start recording while the assistant is busy", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestion.mockImplementation(() => new Promise(() => {}));

      const { view } = makeView();
      await view.onOpen();
      const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
      const sendButton = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
      const micButton = fake(view.contentEl).querySelectorAll("button.rag-chat-mic-button")[0];

      input.value = "Frage?";
      sendButton.dispatch("click");
      await vi.waitFor(() => expect(answerQuestion).toHaveBeenCalled());

      micButton.dispatch("mousedown", { preventDefault: vi.fn() });
      expect(micRecorderStart).not.toHaveBeenCalled();
    });

    it("shows a notice and sends nothing when no understandable speech is recognized", async () => {
      getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
      answerQuestionFromAudio.mockRejectedValueOnce(new Error("Keine verständliche Sprache erkannt."));

      const { view } = makeView();
      await view.onOpen();
      const micButton = fake(view.contentEl).querySelectorAll("button.rag-chat-mic-button")[0];

      pressAndHold(micButton, 500);

      await vi.waitFor(() => expect(answerQuestionFromAudio).toHaveBeenCalledTimes(1));
      expect(Notice.instances.some((n) => n.message.includes("Keine verständliche Sprache"))).toBe(true);
    });

    it("shows a notice when the microphone cannot be accessed", async () => {
      micRecorderStart.mockRejectedValueOnce(new Error("Permission denied"));
      const { view } = makeView();
      await view.onOpen();
      const micButton = fake(view.contentEl).querySelectorAll("button.rag-chat-mic-button")[0];

      micButton.dispatch("mousedown", { preventDefault: vi.fn() });

      await vi.waitFor(() =>
        expect(Notice.instances.some((n) => n.message.includes("Mikrofonzugriff fehlgeschlagen"))).toBe(true),
      );
      expect(micButton.classes.has("is-recording")).toBe(false);
    });
  });
});
