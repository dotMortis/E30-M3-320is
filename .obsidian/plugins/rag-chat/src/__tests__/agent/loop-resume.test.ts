import { describe, expect, it } from "vitest";
import { generateContentResponse } from "../mocks/gemini-http";
import { mockGenerationSequence } from "../mocks/fetch-sse";
import { fakeSettings, makeCtx, requestBody, resumeAgentLoop, runAgentLoop } from "./loop-harness";

describe("resumeAgentLoop", () => {
  it("feeds the user's answer back as the ask_user functionResponse and continues the same round budget", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ name: "ask_user", args: { question: "Welches Baujahr?" } }] }),
    ]);
    const ctx = await makeCtx();
    const paused = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    if (paused.status !== "awaiting_clarification") throw new Error("expected awaiting_clarification");

    mockGenerationSequence([generateContentResponse({ text: "Danke, hier die Antwort für 1988er Modelle." })]);
    const resumed = await resumeAgentLoop(paused.pending, "1988");

    expect(resumed).toMatchObject({ status: "done", text: "Danke, hier die Antwort für 1988er Modelle." });
    const secondBody = requestBody(1);
    const functionResponsePart = secondBody.contents.at(-1).parts[0];
    expect(functionResponsePart.functionResponse).toEqual({ name: "ask_user", response: { answer: "1988" } });
  });

  it("continues counting rounds from where the pause happened rather than resetting", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ name: "ask_user", args: { question: "Welches Baujahr?" } }] }),
    ]);
    const ctx = await makeCtx({ settings: fakeSettings({ maxAgentRounds: 2 }) });
    const paused = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    if (paused.status !== "awaiting_clarification") throw new Error("expected awaiting_clarification");
    expect(paused.pending.state.round).toBe(1);

    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ name: "ask_user", args: { question: "Nochmal?" } }] }),
    ]);
    const resumedPause = await resumeAgentLoop(paused.pending, "1988");
    if (resumedPause.status !== "awaiting_clarification") throw new Error("expected awaiting_clarification");
    expect(resumedPause.pending.state.round).toBe(2);
  });
});
