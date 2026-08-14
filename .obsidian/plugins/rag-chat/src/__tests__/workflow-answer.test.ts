import { describe, expect, it, vi } from "vitest";
import { fakeSettings } from "./fixtures/settings";
import { DEFAULT_SETTINGS } from "../settings/types";
import { TORQUE_BLOCK } from "./fixtures/context-blocks";
import { fakeHit } from "./fixtures/retrieved-hits";
import { createStepReporter } from "../agent/step-reporter";
import type { FuzzySearchApi } from "../retrieval/types";
import { answerQuestion, embedQuery, expandToParentNotes, federatedHybridSearch, indices, mergeWithFuzzy, runAgentLoop, vault } from "./workflow-harness";

describe("answerQuestion", () => {
  it("uses the raw, unmodified question for both baseline retrieval and the agent loop", async () => {
    await answerQuestion({
      question: "und was ist mit 16-03?",
      history: [],
      settings: fakeSettings(),
      vault,
      indices,
      fuzzyApi: null,
    });
    expect(embedQuery).toHaveBeenCalledWith("und was ist mit 16-03?", expect.anything(), expect.any(Function), undefined);
    expect(federatedHybridSearch).toHaveBeenCalledWith(
      indices,
      "und was ist mit 16-03?",
      [0.1, 0.2],
      expect.anything()
    );
    expect(runAgentLoop).toHaveBeenCalledWith(
      expect.objectContaining({ question: "und was ist mit 16-03?" })
    );
  });

  it("runs the baseline retrieval pipeline in order: embed -> hybrid search -> expand to parent notes", async () => {
    await answerQuestion({ question: "Frage?", history: [], settings: fakeSettings(), vault, indices, fuzzyApi: null });
    expect(embedQuery).toHaveBeenCalled();
    expect(federatedHybridSearch).toHaveBeenCalled();
    expect(expandToParentNotes).toHaveBeenCalled();
  });

  it("skips the fuzzy leg entirely when enableFuzzySearchLeg is false, even with a fuzzyApi available", async () => {
    const fuzzyApi: FuzzySearchApi = { search: vi.fn() };
    await answerQuestion({
      question: "Frage?",
      history: [],
      settings: fakeSettings({ enableFuzzySearchLeg: false }),
      vault,
      indices,
      fuzzyApi,
    });
    expect(fuzzyApi.search).not.toHaveBeenCalled();
    expect(mergeWithFuzzy).not.toHaveBeenCalled();
  });

  it("skips the fuzzy leg when no fuzzyApi is provided, even with enableFuzzySearchLeg true", async () => {
    await answerQuestion({ question: "Frage?", history: [], settings: fakeSettings({ enableFuzzySearchLeg: true }), vault, indices, fuzzyApi: null });
    expect(mergeWithFuzzy).not.toHaveBeenCalled();
  });

  it("merges the fuzzy leg's results when enabled and a fuzzyApi is available", async () => {
    const fuzzyApi: FuzzySearchApi = {
      search: vi.fn().mockResolvedValue({ results: [{ notePath: "x.md", seitencode: "", sektion: "", titel: "x", rank: 0 }], correction: null }),
    };
    mergeWithFuzzy.mockReturnValue([fakeHit({ rowId: "merged", notePath: "merged.md" })]);
    await answerQuestion({ question: "Frage?", history: [], settings: fakeSettings({ enableFuzzySearchLeg: true, topK: 5 }), vault, indices, fuzzyApi });
    expect(fuzzyApi.search).toHaveBeenCalledWith("Frage?", 10);
    expect(mergeWithFuzzy).toHaveBeenCalledWith(expect.anything(), expect.anything(), 5, DEFAULT_SETTINGS.rrfK);
    expect(expandToParentNotes).toHaveBeenCalledWith([fakeHit({ rowId: "merged", notePath: "merged.md" })], vault, indices.referenceChunks);
  });

  it("keeps the pure-hybrid results when the fuzzy leg throws (best-effort, not a hard failure)", async () => {
    const fuzzyApi: FuzzySearchApi = { search: vi.fn().mockRejectedValue(new Error("vault-search disabled")) };
    await expect(
      answerQuestion({ question: "Frage?", history: [], settings: fakeSettings({ enableFuzzySearchLeg: true }), vault, indices, fuzzyApi })
    ).resolves.toMatchObject({ status: "done" });
    expect(mergeWithFuzzy).not.toHaveBeenCalled();
  });

  it("reports embedding and retrieval steps to the provided reporter", async () => {
    const onStep = vi.fn();
    const reporter = createStepReporter(onStep);
    await answerQuestion({ question: "Frage?", history: [], settings: fakeSettings(), vault, indices, fuzzyApi: null, reporter });
    const kinds = onStep.mock.calls.map(([step]) => step.kind);
    expect(kinds).toContain("embedding");
    expect(kinds).toContain("retrieval");
  });

  it("maps a 'done' agent result to WorkflowDone", async () => {
    const result = await answerQuestion({ question: "Frage?", history: [], settings: fakeSettings(), vault, indices, fuzzyApi: null });
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
    runAgentLoop.mockResolvedValue({ status: "awaiting_clarification", question: "Welches Baujahr?", pending });
    const result = await answerQuestion({ question: "Frage?", history: [], settings: fakeSettings(), vault, indices, fuzzyApi: null });
    expect(result).toEqual({ status: "awaiting_clarification", question: "Welches Baujahr?", pending });
  });

  it("rejects immediately without retrieving anything when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      answerQuestion({ question: "Frage?", history: [], settings: fakeSettings(), vault, indices, fuzzyApi: null, signal: controller.signal })
    ).rejects.toThrow("Anfrage abgebrochen.");
    expect(embedQuery).not.toHaveBeenCalled();
    expect(runAgentLoop).not.toHaveBeenCalled();
  });
});

