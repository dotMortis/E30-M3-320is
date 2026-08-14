import type { Vault } from "obsidian";
import { runAgentLoop, resumeAgentLoop } from "./agent/loop";
import type { PendingAgentState } from "./agent/types";
import type { GroundingChunk, GroundingSupport } from "./gemini/types";
import { embedQuery } from "./retrieval/embeddings";
import { federatedHybridSearch } from "./retrieval/hybrid-search";
import { mergeWithFuzzy } from "./retrieval/fuzzy-merge";
import { expandToParentNotes } from "./retrieval/parent-notes";
import type { CachedIndices, ChatTurn, ContextBlock, FuzzySearchApi, WebCitation } from "./retrieval/types";
import type { RagChatSettings } from "./settings/types";
import { ABORT_ERROR_MESSAGE, FUZZY_LEG_RESULT_LIMIT } from "./constants";

export interface WorkflowParams {
  question: string;
  history: ChatTurn[];
  settings: RagChatSettings;
  vault: Vault;
  indices: CachedIndices;
  fuzzyApi: FuzzySearchApi | null;
  onStatus?: (status: string) => void;
  signal?: AbortSignal;
}

export interface WorkflowDone {
  status: "done";
  text: string;
  manualCitations: ContextBlock[];
  webCitations: WebCitation[];
  webGroundingChunks: GroundingChunk[];
  webGroundingSupports: GroundingSupport[];
}

export interface WorkflowAwaitingClarification {
  status: "awaiting_clarification";
  question: string;
  pending: PendingAgentState;
}

export type WorkflowResult = WorkflowDone | WorkflowAwaitingClarification;

async function baselineRetrieve(
  query: string,
  settings: RagChatSettings,
  indices: CachedIndices,
  fuzzyApi: FuzzySearchApi | null,
  vault: Vault,
  onStatus?: (status: string) => void,
  signal?: AbortSignal
): Promise<ContextBlock[]> {
  const vector = await embedQuery(query, settings, onStatus, signal);
  const hybridHits = await federatedHybridSearch(indices, query, vector, settings);

  let hits = hybridHits;
  if (settings.enableFuzzySearchLeg && fuzzyApi) {
    try {
      const fuzzy = await fuzzyApi.search(query, FUZZY_LEG_RESULT_LIMIT);
      hits = mergeWithFuzzy(hybridHits, fuzzy.results, settings.topK, settings.rrfK);
    } catch {}
  }

  return expandToParentNotes(hits, vault, indices.referenceChunks);
}

export async function answerQuestion(params: WorkflowParams): Promise<WorkflowResult> {
  const { question, history, settings, vault, indices, fuzzyApi, onStatus, signal } = params;

  if (signal?.aborted) {
    throw new Error(ABORT_ERROR_MESSAGE);
  }
  onStatus?.("Durchsuche Handbuch …");
  const baselineBlocks = await baselineRetrieve(question, settings, indices, fuzzyApi, vault, onStatus, signal);
  onStatus?.(`Basis-Suche: ${baselineBlocks.length} Seite(n) gefunden`);

  const result = await runAgentLoop({
    question,
    history,
    baselineBlocks,
    ctx: { settings, vault, indices, fuzzyApi, onStatus, signal },
  });

  if (result.status === "awaiting_clarification") {
    return { status: "awaiting_clarification", question: result.question, pending: result.pending };
  }
  return {
    status: "done",
    text: result.text,
    manualCitations: result.manualCitations,
    webCitations: result.webCitations,
    webGroundingChunks: result.webGroundingChunks,
    webGroundingSupports: result.webGroundingSupports,
  };
}

export async function continueAnswer(
  pending: PendingAgentState,
  userAnswer: string,
  signal?: AbortSignal
): Promise<WorkflowResult> {
  if (signal?.aborted) {
    throw new Error(ABORT_ERROR_MESSAGE);
  }
  const result = await resumeAgentLoop(pending, userAnswer, signal);
  if (result.status === "awaiting_clarification") {
    return { status: "awaiting_clarification", question: result.question, pending: result.pending };
  }
  return {
    status: "done",
    text: result.text,
    manualCitations: result.manualCitations,
    webCitations: result.webCitations,
    webGroundingChunks: result.webGroundingChunks,
    webGroundingSupports: result.webGroundingSupports,
  };
}
