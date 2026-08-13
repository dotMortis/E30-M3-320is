import type { Vault } from "obsidian";
import { runAgentLoop, resumeAgentLoop, type PendingAgentState } from "./agent";
import type { GroundingChunk, GroundingSupport } from "./gemini";
import {
  embedQuery,
  expandToParentNotes,
  federatedHybridSearch,
  mergeWithFuzzy,
  resolveFollowupQuery,
  type CachedIndices,
  type ChatTurn,
  type ContextBlock,
  type FuzzySearchApi,
  type WebCitation,
} from "./retriever";
import type { RagChatSettings } from "./settings";

/**
 * workflow.ts — the query-time entry point: plan → free baseline retrieval →
 * hand off to the agent loop (see agent.ts).
 *
 * This used to also own a deterministic "widen similarity / LLM query
 * rewrite / self-critique" retry stack. That's been removed entirely and
 * replaced by agent.ts's bounded tool-calling loop, which lets the model
 * itself decide when the baseline retrieval below isn't enough (re-search,
 * fetch a specific page, search the web, or ask the user) rather than
 * following a fixed hidden heuristic. See agent.ts's module doc for the
 * full loop shape.
 *
 * Steps:
 *   1. Plan  - resolveFollowupQuery() (free, deterministic) resolves short
 *      follow-up questions against the previous turn.
 *   2. Baseline retrieval - one hybrid (BM25+vector) search plus Vault
 *      Search's fuzzy leg, expanded to full parent notes. This is free (no
 *      extra LLM call) and covers the common case entirely on its own.
 *   3. Agent loop - the baseline context seeds the model's first turn; from
 *      there the model can call tools for more, or answer directly.
 */

export interface WorkflowParams {
  question: string;
  /** Prior turns of this session, EXCLUDING the current question and the
   * (empty, in-progress) assistant turn being answered. */
  history: ChatTurn[];
  settings: RagChatSettings;
  vault: Vault;
  indices: CachedIndices;
  fuzzyApi: FuzzySearchApi | null;
  /** Called with a short German progress label while a retrieval/tool round
   * is in flight, purely for UI feedback (see agent.ts's onStatus calls). */
  onStatus?: (status: string) => void;
}

export interface WorkflowDone {
  status: "done";
  text: string;
  manualCitations: ContextBlock[];
  webCitations: WebCitation[];
  /** See agent.ts's AgentDone - only this exact turn's final-round grounding
   * data, for inline citation splicing (citation-links.ts). */
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
    } catch {
      // Fuzzy leg is best-effort (e.g. vault-search plugin disabled/missing) -
      // keep the pure hybrid results rather than failing the whole turn.
    }
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
