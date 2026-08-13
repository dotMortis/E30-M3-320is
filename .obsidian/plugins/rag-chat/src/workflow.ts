import type { Vault } from "obsidian";
import { runAgentLoop, resumeAgentLoop } from "./agent/loop";
import type { PendingAgentState } from "./agent/types";
import type { GroundingChunk, GroundingSupport } from "./gemini/types";
import { embedQuery } from "./retrieval/embeddings";
import { federatedHybridSearch } from "./retrieval/hybrid-search";
import { mergeWithFuzzy } from "./retrieval/fuzzy-merge";
import { resolveFollowupQuery } from "./retrieval/followup";
import { expandToParentNotes } from "./retrieval/parent-notes";
import type { CachedIndices, ChatTurn, ContextBlock, FuzzySearchApi, WebCitation } from "./retrieval/types";
import type { RagChatSettings } from "./settings/types";

export interface WorkflowParams {
  question: string;
  history: ChatTurn[];
  settings: RagChatSettings;
  vault: Vault;
  indices: CachedIndices;
  fuzzyApi: FuzzySearchApi | null;
  onStatus?: (status: string) => void;
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
  onStatus?: (status: string) => void
): Promise<ContextBlock[]> {
  const vector = await embedQuery(query, settings, onStatus);
  const hybridHits = await federatedHybridSearch(indices, query, vector, settings);

  let hits = hybridHits;
  if (settings.enableFuzzySearchLeg && fuzzyApi) {
    try {
      const fuzzy = await fuzzyApi.search(query, 10);
      hits = mergeWithFuzzy(hybridHits, fuzzy.results, settings.topK);
    } catch {}
  }

  return expandToParentNotes(hits, vault, indices.referenceChunks);
}

export async function answerQuestion(params: WorkflowParams): Promise<WorkflowResult> {
  const { question, history, settings, vault, indices, fuzzyApi, onStatus } = params;

  const resolvedQuery = resolveFollowupQuery(question, history);

  onStatus?.("Durchsuche Handbuch …");
  const baselineBlocks = await baselineRetrieve(resolvedQuery, settings, indices, fuzzyApi, vault, onStatus);
  onStatus?.(`Basis-Suche: ${baselineBlocks.length} Seite(n) gefunden`);

  const result = await runAgentLoop({
    question,
    history,
    baselineBlocks,
    ctx: { settings, vault, indices, fuzzyApi, onStatus },
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

export async function continueAnswer(pending: PendingAgentState, userAnswer: string): Promise<WorkflowResult> {
  const result = await resumeAgentLoop(pending, userAnswer);
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
