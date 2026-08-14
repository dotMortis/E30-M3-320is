import { describe, expect, it, vi } from "vitest";
import { fakeSettings } from "./fixtures/settings";
import { TORQUE_BLOCK } from "./fixtures/context-blocks";
import {
  answerQuestionFromAudio,
  embedQuery,
  expandToParentNotes,
  federatedHybridSearch,
  indices,
  runAudioAgentLoop,
  vault,
} from "./workflow-harness";

describe("answerQuestionFromAudio", () => {
  it("passes the audio payload, history and callbacks straight into runAudioAgentLoop", async () => {
    const onTranscriptReady = vi.fn();
    const onTextDelta = vi.fn();
    const onShortAnswerReady = vi.fn();

    await answerQuestionFromAudio({
      base64Audio: "QUJD",
      mimeType: "audio/wav",
      history: [],
      settings: fakeSettings(),
      vault,
      indices,
      fuzzyApi: null,
      onTranscriptReady,
      onTextDelta,
      onShortAnswerReady,
    });

    expect(runAudioAgentLoop).toHaveBeenCalledWith(
      expect.objectContaining({
        base64Audio: "QUJD",
        mimeType: "audio/wav",
        history: [],
        ctx: expect.objectContaining({ onTranscriptReady, onTextDelta, onShortAnswerReady }),
        retrieve: expect.any(Function),
      }),
    );
  });

  it("runs the same baseline retrieval pipeline as the text flow when the retrieve callback is invoked", async () => {
    await answerQuestionFromAudio({
      base64Audio: "QUJD",
      mimeType: "audio/wav",
      history: [],
      settings: fakeSettings(),
      vault,
      indices,
      fuzzyApi: null,
    });

    const { retrieve } = runAudioAgentLoop.mock.calls[0][0];
    const blocks = await retrieve("Anzugsdrehmoment?");

    expect(embedQuery).toHaveBeenCalledWith("Anzugsdrehmoment?", expect.anything(), expect.any(Function), undefined);
    expect(federatedHybridSearch).toHaveBeenCalledWith(indices, "Anzugsdrehmoment?", [0.1, 0.2], expect.anything());
    expect(expandToParentNotes).toHaveBeenCalled();
    expect(blocks).toEqual([TORQUE_BLOCK]);
  });

  it("maps a 'done' agent result to WorkflowDone", async () => {
    const result = await answerQuestionFromAudio({
      base64Audio: "QUJD",
      mimeType: "audio/wav",
      history: [],
      settings: fakeSettings(),
      vault,
      indices,
      fuzzyApi: null,
    });
    expect(result).toEqual({
      status: "done",
      text: "Antwort",
      manualCitations: [TORQUE_BLOCK],
      webCitations: [],
      webGroundingChunks: [],
      webGroundingSupports: [],
    });
  });

  it("maps an 'awaiting_clarification' agent result to WorkflowAwaitingClarification", async () => {
    const pending = { state: {}, ctx: {} } as any;
    runAudioAgentLoop.mockResolvedValue({ status: "awaiting_clarification", question: "Welches Baujahr?", pending });
    const result = await answerQuestionFromAudio({
      base64Audio: "QUJD",
      mimeType: "audio/wav",
      history: [],
      settings: fakeSettings(),
      vault,
      indices,
      fuzzyApi: null,
    });
    expect(result).toEqual({ status: "awaiting_clarification", question: "Welches Baujahr?", pending });
  });

  it("rejects immediately without invoking the audio loop when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      answerQuestionFromAudio({
        base64Audio: "QUJD",
        mimeType: "audio/wav",
        history: [],
        settings: fakeSettings(),
        vault,
        indices,
        fuzzyApi: null,
        signal: controller.signal,
      }),
    ).rejects.toThrow("Anfrage abgebrochen.");
    expect(runAudioAgentLoop).not.toHaveBeenCalled();
  });
});
