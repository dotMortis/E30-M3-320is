import type { Vault } from "obsidian";
import { describeEmbedding, describeRetrieval } from "./agent/status-text";
import { NOOP_STEP_REPORTER, type StepReporter } from "./agent/step-reporter";
import { runAgentLoop, resumeAgentLoop } from "./agent/loop";
import type { AgentResult, PendingAgentState } from "./agent/types";
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
  reporter?: StepReporter;

  onTextDelta?: (text: string) => void;
  onShortAnswerReady?: (text: string) => void;
  signal?: AbortSignal;
}

export interface WorkflowDone {
  status: "done";
  text: string;
  shortAnswer?: string;
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

function toWorkflowResult(result: AgentResult): WorkflowResult {
  if (result.status === "awaiting_clarification") {
    return { status: "awaiting_clarification", question: result.question, pending: result.pending };
  }
  return {
    status: "done",
    text: result.text,
    shortAnswer: result.shortAnswer,
    manualCitations: result.manualCitations,
    webCitations: result.webCitations,
    webGroundingChunks: result.webGroundingChunks,
    webGroundingSupports: result.webGroundingSupports,
  };
}

async function baselineRetrieve(
  query: string,
  settings: RagChatSettings,
  indices: CachedIndices,
  fuzzyApi: FuzzySearchApi | null,
  vault: Vault,
  reporter: StepReporter,
  signal?: AbortSignal
): Promise<ContextBlock[]> {
  const embeddingStep = reporter.start({
    kind: "embedding",
    title: "Erzeuge Such-Embedding …",
    model: settings.embeddingModel,
  });
  const vector = await embedQuery(query, settings, (status) => reporter.update(embeddingStep, { title: status }), signal);
  reporter.finish(embeddingStep, {
    title: "Such-Embedding erzeugt",
    narration: describeEmbedding(settings.embeddingModel, settings.outputDim),
  });

  const retrievalStep = reporter.start({
    kind: "retrieval",
    title: `Durchsuche Handbuch nach "${query}" …`,
  });
  const hybridHits = await federatedHybridSearch(indices, query, vector, settings);

  let hits = hybridHits;
  let usedFuzzy = false;
  if (settings.enableFuzzySearchLeg && fuzzyApi) {
    try {
      const fuzzy = await fuzzyApi.search(query, FUZZY_LEG_RESULT_LIMIT);
      hits = mergeWithFuzzy(hybridHits, fuzzy.results, settings.topK, settings.rrfK);
      usedFuzzy = true;
    } catch {}
  }

  reporter.finish(retrievalStep, {
    title: `Handbuchsuche nach "${query}" abgeschlossen`,
    narration: describeRetrieval(query, hits.length, usedFuzzy),
    hits: hits.map((h) => ({ seitencode: h.seitencode, sektion: h.sektion, titel: h.titel, score: h.score })),
  });

  return expandToParentNotes(hits, vault, indices.referenceChunks);
}

export async function answerQuestion(params: WorkflowParams): Promise<WorkflowResult> {
  const { question, history, settings, vault, indices, fuzzyApi, reporter, onTextDelta, onShortAnswerReady, signal } =
    params;

  if (signal?.aborted) {
    throw new Error(ABORT_ERROR_MESSAGE);
  }
  const rep = reporter ?? NOOP_STEP_REPORTER;
  const baselineBlocks = await baselineRetrieve(question, settings, indices, fuzzyApi, vault, rep, signal);

  const result = await runAgentLoop({
    question,
    history,
    baselineBlocks,
    ctx: { settings, vault, indices, fuzzyApi, reporter: rep, onTextDelta, onShortAnswerReady, signal },
  });
  return toWorkflowResult(result);
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
  return toWorkflowResult(result);
}
