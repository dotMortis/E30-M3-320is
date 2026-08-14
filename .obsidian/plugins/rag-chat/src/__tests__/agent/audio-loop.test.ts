import { describe, expect, it, vi } from "vitest";
import { generateContentResponse } from "../mocks/gemini-http";
import { mockGenerationSequence } from "../mocks/fetch-sse";
import { TORQUE_BLOCK } from "../fixtures/context-blocks";
import { fakeSettings, makeCtx, requestBody, runAudioAgentLoop } from "./loop-harness";

describe("runAudioAgentLoop", () => {
  it("sends the inline audio as the first round with no tools, no prior baseline context", async () => {
    mockGenerationSequence([
      generateContentResponse({ text: "%%%TRANSCRIPT_START%%%Anzugsdrehmoment?%%%TRANSCRIPT_END%%%" }),
      generateContentResponse({ text: "Antwort." }),
    ]);
    const ctx = await makeCtx();
    const retrieve = vi.fn().mockResolvedValue([TORQUE_BLOCK]);

    await runAudioAgentLoop({ base64Audio: "QUJD", mimeType: "audio/wav", history: [], ctx, retrieve });

    const firstBody = requestBody(0);
    expect(firstBody.tools).toBeUndefined();
    expect(firstBody.systemInstruction).toBeUndefined();
    expect(firstBody.contents[0]).toEqual({
      role: "user",
      parts: expect.arrayContaining([{ inlineData: { mimeType: "audio/wav", data: "QUJD" } }]),
    });
  });

  it("never enables thinking or web search for the transcript round, even when those settings are on", async () => {
    mockGenerationSequence([
      generateContentResponse({ text: "%%%TRANSCRIPT_START%%%Anzugsdrehmoment?%%%TRANSCRIPT_END%%%" }),
      generateContentResponse({ text: "Antwort." }),
    ]);
    const ctx = await makeCtx({ settings: fakeSettings({ thinkingEnabled: true, webSearchEnabled: true }) });
    const retrieve = vi.fn().mockResolvedValue([TORQUE_BLOCK]);

    await runAudioAgentLoop({ base64Audio: "QUJD", mimeType: "audio/wav", history: [], ctx, retrieve });

    const firstBody = requestBody(0);
    expect(firstBody.tools).toBeUndefined();
    expect(firstBody.generationConfig?.thinkingConfig).toBeDefined();
  });

  it("extracts the transcript, retrieves baseline context for it, and runs the normal agent loop", async () => {
    mockGenerationSequence([
      generateContentResponse({ text: "%%%TRANSCRIPT_START%%%Anzugsdrehmoment?%%%TRANSCRIPT_END%%%" }),
      generateContentResponse({ text: "Antwort." }),
    ]);
    const ctx = await makeCtx();
    const retrieve = vi.fn().mockResolvedValue([TORQUE_BLOCK]);

    const result = await runAudioAgentLoop({ base64Audio: "QUJD", mimeType: "audio/wav", history: [], ctx, retrieve });

    expect(retrieve).toHaveBeenCalledTimes(1);
    expect(retrieve).toHaveBeenCalledWith("Anzugsdrehmoment?");
    expect(result).toMatchObject({ status: "done", text: "Antwort.", manualCitations: [TORQUE_BLOCK] });

    const secondBody = requestBody(1);
    const lastContent = secondBody.contents.at(-1);
    expect(lastContent.parts[0].text).toContain("<context>");
    expect(lastContent.parts[0].text).toContain(TORQUE_BLOCK.fullText);
    expect(lastContent.parts[0].text).toContain("<question>\nAnzugsdrehmoment?\n</question>");
  });

  it("fires onTranscriptReady with the transcript before continuing the loop", async () => {
    mockGenerationSequence([
      generateContentResponse({ text: "%%%TRANSCRIPT_START%%%Anzugsdrehmoment?%%%TRANSCRIPT_END%%%" }),
      generateContentResponse({ text: "Antwort." }),
    ]);
    const onTranscriptReady = vi.fn();
    const ctx = await makeCtx({ onTranscriptReady });
    const retrieve = vi.fn().mockResolvedValue([TORQUE_BLOCK]);

    await runAudioAgentLoop({ base64Audio: "QUJD", mimeType: "audio/wav", history: [], ctx, retrieve });

    expect(onTranscriptReady).toHaveBeenCalledWith("Anzugsdrehmoment?");
  });

  it("throws without retrieving anything when no understandable speech is transcribed", async () => {
    mockGenerationSequence([generateContentResponse({ text: "%%%TRANSCRIPT_START%%%%%%TRANSCRIPT_END%%%" })]);
    const ctx = await makeCtx();
    const retrieve = vi.fn();

    await expect(
      runAudioAgentLoop({ base64Audio: "QUJD", mimeType: "audio/wav", history: [], ctx, retrieve }),
    ).rejects.toThrow("Keine verständliche Sprache erkannt.");
    expect(retrieve).not.toHaveBeenCalled();
  });
});
