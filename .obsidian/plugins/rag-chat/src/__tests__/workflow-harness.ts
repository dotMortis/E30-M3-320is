import { beforeEach, vi } from "vitest";
import type { Vault } from "obsidian";
import { TORQUE_BLOCK } from "./fixtures/context-blocks";
import { fakeHit } from "./fixtures/retrieved-hits";

export const embedQuery = vi.fn();
vi.mock("../retrieval/embeddings", () => ({ embedQuery }));

export const federatedHybridSearch = vi.fn();
vi.mock("../retrieval/hybrid-search", () => ({ federatedHybridSearch }));

export const mergeWithFuzzy = vi.fn();
vi.mock("../retrieval/fuzzy-merge", () => ({ mergeWithFuzzy }));

export const expandToParentNotes = vi.fn();
vi.mock("../retrieval/parent-notes", () => ({ expandToParentNotes }));

export const runAgentLoop = vi.fn();
export const resumeAgentLoop = vi.fn();
vi.mock("../agent/loop", () => ({ runAgentLoop, resumeAgentLoop }));

export const runAudioAgentLoop = vi.fn();
vi.mock("../agent/audio-loop", () => ({ runAudioAgentLoop }));

export let answerQuestion: typeof import("../workflow").answerQuestion;
export let answerQuestionFromAudio: typeof import("../workflow").answerQuestionFromAudio;
export let continueAnswer: typeof import("../workflow").continueAnswer;

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
  runAudioAgentLoop.mockResolvedValue({
    status: "done",
    text: "Antwort",
    manualCitations: [TORQUE_BLOCK],
    webCitations: [],
    webGroundingChunks: [],
    webGroundingSupports: [],
  });
  const mod = await import("../workflow");
  answerQuestion = mod.answerQuestion;
  answerQuestionFromAudio = mod.answerQuestionFromAudio;
  continueAnswer = mod.continueAnswer;
});

export const indices = { textDb: {}, vectorDbs: [], referenceChunks: new Map() } as any;
export const vault = {} as unknown as Vault;
