import type { AnyOrama } from "@orama/orama";
import type { PendingAgentState } from "../agent/types";
import type { GroundingChunk, GroundingSupport } from "../gemini/types";

export interface RagManifest {
  embeddingModel: string;
  embeddingDims: number;
  docPrefixTemplate: string;
  queryPrefixTemplate: string;
  generationModel: string;
  noteCount: number;
  textChunkCount: number;
  multimodalCount: number;
  referenceChunkCount: number;
  referenceDocCount: number;
  referenceChunksFile: string;
  totalRowCount: number;
  textIndexFile: string;
  textIndexBytes: number;
  vectorShardCount: number;
  vectorIndexFilePattern: string;
  vectorShardBytes: number[];
  corpusHash: string;
  chunkedAt: string;
  builtAt: string;
}

export interface RetrievedHit {
  score: number;
  rowId: string;
  notePath: string;
  seitencode: string;
  sektion: string;
  titel: string;
  kind: "text" | "multimodal" | "reference";
}

export interface ContextBlock {
  notePath: string;
  seitencode: string;
  sektion: string;
  titel: string;
  fullText: string;
}

export type ReferenceChunkMap = Map<string, { text: string; titel: string; notePath: string }>;

export interface CompactHit {
  notePath: string;
  seitencode: string;
  sektion: string;
  titel: string;
}

export interface WebCitation {
  uri: string;
  title: string;
}

export type PipelineStepKind =
  | "retrieval"
  | "embedding"
  | "llm_round"
  | "tool_call"
  | "clarification"
  | "budget_exhausted"
  | "final_answer";

export type PipelineStepStatus = "running" | "done" | "error";

export interface PipelineStepHit {
  seitencode: string;
  sektion: string;
  titel: string;
  score?: number;
}

export interface PipelineStep {
  id: string;
  kind: PipelineStepKind;
  round?: number;
  title: string;
  narration?: string;
  model?: string;
  status: PipelineStepStatus;
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: Record<string, unknown>;
  hits?: PipelineStepHit[];
  errorMessage?: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  status?: string;
  steps?: PipelineStep[];
  citations?: ContextBlock[];
  webCitations?: WebCitation[];
  webGroundingChunks?: GroundingChunk[];
  webGroundingSupports?: GroundingSupport[];
  isClarifying?: boolean;
  retry?: { message: string; pendingBefore: PendingAgentState | null };
  /** Cached short/spoken-friendly answer text (see tts/short-answer.ts). */
  ttsText?: string;
  /** Cached synthesized MP3 (base64), so replay never re-hits the TTS API. */
  ttsAudioBase64?: string;
  ttsStatus?: "generating" | "ready" | "error";
}

export interface FuzzySearchHit {
  notePath: string;
  seitencode: string;
  sektion: string;
  titel: string;
  rank: number;
}

export interface FuzzySearchApi {
  search(
    query: string,
    limit?: number
  ): Promise<{ results: FuzzySearchHit[]; correction: { from: string; to: string } | null }>;
}

export interface CachedIndices {
  textDb: AnyOrama;
  vectorDbs: AnyOrama[];
  referenceChunks: ReferenceChunkMap;
}
