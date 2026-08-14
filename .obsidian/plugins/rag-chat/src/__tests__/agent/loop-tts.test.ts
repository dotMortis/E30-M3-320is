import { describe, expect, it, vi } from "vitest";
import { generateContentResponse } from "../mocks/gemini-http";
import { mockGenerationSequence } from "../mocks/fetch-sse";
import type { FuzzySearchApi } from "../../retrieval/types";
import { fakeSettings, makeCtx, runAgentLoop } from "./loop-harness";

const SHORT_ANSWER_WRAPPED =
  "%%%SHORT_ANSWER_START%%%Zylinderkopfschrauben mit 30 Nm anziehen.%%%SHORT_ANSWER_END%%%" +
  "%%%ANSWER_START%%%Zylinderkopfschrauben: 30 Nm. [Seite 11-09]%%%ANSWER_END%%%";

describe("runAgentLoop short/long answer split", () => {
  it("strips the markers from the final text and exposes the streamed short answer", async () => {
    mockGenerationSequence([generateContentResponse({ text: SHORT_ANSWER_WRAPPED })]);
    const ctx = await makeCtx({ settings: fakeSettings({ ttsEnabled: true }) });
    const result = await runAgentLoop({ question: "Wie viel Nm?", history: [], baselineBlocks: [], ctx });

    if (result.status !== "done") throw new Error("expected done");
    expect(result.text).toBe("Zylinderkopfschrauben: 30 Nm. [Seite 11-09]");
    expect(result.shortAnswer).toBe("Zylinderkopfschrauben mit 30 Nm anziehen.");
  });

  it("fires onShortAnswerReady with the short answer text before the round finishes streaming", async () => {
    mockGenerationSequence([generateContentResponse({ text: SHORT_ANSWER_WRAPPED })]);
    const onShortAnswerReady = vi.fn();
    const ctx = await makeCtx({ settings: fakeSettings({ ttsEnabled: true }), onShortAnswerReady });
    await runAgentLoop({ question: "Wie viel Nm?", history: [], baselineBlocks: [], ctx });

    expect(onShortAnswerReady).toHaveBeenCalledTimes(1);
    expect(onShortAnswerReady).toHaveBeenCalledWith("Zylinderkopfschrauben mit 30 Nm anziehen.");
  });

  it("forwards only the marker-stripped answer text to onTextDelta", async () => {
    mockGenerationSequence([generateContentResponse({ text: SHORT_ANSWER_WRAPPED })]);
    const onTextDelta = vi.fn();
    const ctx = await makeCtx({ settings: fakeSettings({ ttsEnabled: true }), onTextDelta });
    await runAgentLoop({ question: "Wie viel Nm?", history: [], baselineBlocks: [], ctx });

    for (const call of onTextDelta.mock.calls) {
      expect(call[0]).not.toContain("%%%");
    }
    expect(onTextDelta.mock.calls.at(-1)?.[0]).toBe("Zylinderkopfschrauben: 30 Nm. [Seite 11-09]");
  });

  it("leaves text untouched and shortAnswer undefined when no markers are present", async () => {
    mockGenerationSequence([generateContentResponse({ text: "Direkte Antwort." })]);
    const onShortAnswerReady = vi.fn();
    const ctx = await makeCtx({ settings: fakeSettings({ ttsEnabled: false }), onShortAnswerReady });
    const result = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });

    if (result.status !== "done") throw new Error("expected done");
    expect(result.text).toBe("Direkte Antwort.");
    expect(result.shortAnswer).toBeUndefined();
    expect(onShortAnswerReady).not.toHaveBeenCalled();
  });

  it("does not fire onShortAnswerReady for a tool-invoking round, only for the actual final round", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ name: "search_manual_fuzzy", args: { query: "kopf" } }] }),
      generateContentResponse({ text: SHORT_ANSWER_WRAPPED }),
    ]);
    const fuzzyApi: FuzzySearchApi = { search: vi.fn().mockResolvedValue({ results: [], correction: null }) };
    const onShortAnswerReady = vi.fn();
    const ctx = await makeCtx({ settings: fakeSettings({ ttsEnabled: true }), fuzzyApi, onShortAnswerReady });
    const result = await runAgentLoop({ question: "Wie viel Nm?", history: [], baselineBlocks: [], ctx });

    if (result.status !== "done") throw new Error("expected done");
    expect(onShortAnswerReady).toHaveBeenCalledTimes(1);
    expect(result.shortAnswer).toBe("Zylinderkopfschrauben mit 30 Nm anziehen.");
  });

  it("splits the short/long answer for a forced final round once maxAgentRounds is exhausted", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ name: "search_manual_fuzzy", args: { query: "a" } }] }),
      generateContentResponse({ text: SHORT_ANSWER_WRAPPED }),
    ]);
    const fuzzyApi: FuzzySearchApi = { search: vi.fn().mockResolvedValue({ results: [], correction: null }) };
    const onShortAnswerReady = vi.fn();
    const ctx = await makeCtx({
      settings: fakeSettings({ ttsEnabled: true, maxAgentRounds: 1 }),
      fuzzyApi,
      onShortAnswerReady,
    });
    const result = await runAgentLoop({ question: "Wie viel Nm?", history: [], baselineBlocks: [], ctx });

    if (result.status !== "done") throw new Error("expected done");
    expect(result.text).toBe("Zylinderkopfschrauben: 30 Nm. [Seite 11-09]");
    expect(result.shortAnswer).toBe("Zylinderkopfschrauben mit 30 Nm anziehen.");
    expect(onShortAnswerReady).toHaveBeenCalledWith("Zylinderkopfschrauben mit 30 Nm anziehen.");
  });

  it("falls back to the marker-stripped full text when the model opens a short block but never closes it", async () => {
    mockGenerationSequence([
      generateContentResponse({ text: "%%%SHORT_ANSWER_START%%%Kaputtes Format ohne Ende." }),
    ]);
    const ctx = await makeCtx({ settings: fakeSettings({ ttsEnabled: true }) });
    const result = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });

    if (result.status !== "done") throw new Error("expected done");
    expect(result.shortAnswer).toBeUndefined();
    expect(result.text).toBe("Kaputtes Format ohne Ende.");
  });
});
