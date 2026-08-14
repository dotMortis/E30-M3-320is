import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { fakeSettings } from "./fixtures/settings";
import { DEFAULT_SETTINGS } from "../settings/types";
import { TORQUE_BLOCK } from "./fixtures/context-blocks";
import { fakeHit } from "./fixtures/retrieved-hits";
import { createStepReporter } from "../agent/step-reporter";
import type { FuzzySearchApi } from "../retrieval/types";

const embedQuery = vi.fn();
vi.mock("../retrieval/embeddings", () => ({ embedQuery }));

const federatedHybridSearch = vi.fn();
vi.mock("../retrieval/hybrid-search", () => ({ federatedHybridSearch }));

const mergeWithFuzzy = vi.fn();
vi.mock("../retrieval/fuzzy-merge", () => ({ mergeWithFuzzy }));

const expandToParentNotes = vi.fn();
vi.mock("../retrieval/parent-notes", () => ({ expandToParentNotes }));

const runAgentLoop = vi.fn();
const resumeAgentLoop = vi.fn();
vi.mock("../agent/loop", () => ({ runAgentLoop, resumeAgentLoop }));

let answerQuestion: typeof import("../workflow").answerQuestion;
let continueAnswer: typeof import("../workflow").continueAnswer;

beforeEach(async () => {
  vi.clearAllMocks();
  embedQuery.mockResolvedValue([0.1, 0.2]);
  federatedHybridSearch.mockResolvedValue([fakeHit({ rowId: "a", notePath: "a.md" })]);
  expandToParentNotes.mockResolvedValue([TORQUE_BLOCK]);
  runAgentLoop.mockResolvedValue({
    status: "done",
    text: "Antwort",
    manualCitations: [TORQUE_BLOCK],
    webCitations: [],
    webGroundingChunks: [],
    webGroundingSupports: [],
  });
  ({ answerQuestion, continueAnswer } = await import("../workflow"));
});

const indices = { textDb: {}, vectorDbs: [], referenceChunks: new Map() } as any;
const vault = {} as unknown as Vault;

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

describe("continueAnswer", () => {
  it("delegates to resumeAgentLoop and maps a 'done' result", async () => {
    resumeAgentLoop.mockResolvedValue({
      status: "done",
      text: "Fortgesetzte Antwort",
      manualCitations: [],
      webCitations: [],
      webGroundingChunks: [],
      webGroundingSupports: [],
    });
    const pending = { state: {}, ctx: {} } as any;
    const result = await continueAnswer(pending, "1988");
    expect(resumeAgentLoop).toHaveBeenCalledWith(pending, "1988", undefined);
    expect(result).toMatchObject({ status: "done", text: "Fortgesetzte Antwort" });
  });

  it("maps an 'awaiting_clarification' result from a second consecutive clarifying question", async () => {
    const pending2 = { state: {}, ctx: {} } as any;
    resumeAgentLoop.mockResolvedValue({ status: "awaiting_clarification", question: "Und welches Modell?", pending: pending2 });
    const result = await continueAnswer({ state: {}, ctx: {} } as any, "1988");
    expect(result).toEqual({ status: "awaiting_clarification", question: "Und welches Modell?", pending: pending2 });
  });

  it("rejects immediately without resuming the agent loop when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const pending = { state: {}, ctx: {} } as any;
    await expect(continueAnswer(pending, "1988", controller.signal)).rejects.toThrow("Anfrage abgebrochen.");
    expect(resumeAgentLoop).not.toHaveBeenCalled();
  });
});
