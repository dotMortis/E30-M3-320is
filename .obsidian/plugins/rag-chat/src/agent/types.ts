import type { Vault } from "obsidian";
import type { StepReporter } from "./step-reporter";
import type { GeminiContent, GroundingChunk, GroundingSupport } from "../gemini/types";
import type { CachedIndices, ContextBlock, FuzzySearchApi, WebCitation } from "../retrieval/types";
import type { RagChatSettings } from "../settings/types";

export interface AgentLoopContext {
  settings: RagChatSettings;
  vault: Vault;
  indices: CachedIndices;
  fuzzyApi: FuzzySearchApi | null;
  reporter?: StepReporter;

  onTextDelta?: (text: string) => void;
  onShortAnswerReady?: (text: string) => void;
  onTranscriptReady?: (text: string) => void;
  signal?: AbortSignal;
}

export interface AgentLoopState {
  contents: GeminiContent[];
  round: number;
  manualPages: Map<string, ContextBlock>;
  webCitations: Map<string, WebCitation>;
}

export interface PendingAgentState {
  state: AgentLoopState;
  ctx: AgentLoopContext;
}

export interface AgentDone {
  status: "done";
  text: string;
  shortAnswer?: string;
  manualCitations: ContextBlock[];
  webCitations: WebCitation[];
  webGroundingChunks: GroundingChunk[];
  webGroundingSupports: GroundingSupport[];
}

export interface AgentAwaitingClarification {
  status: "awaiting_clarification";
  question: string;
  pending: PendingAgentState;
}

export type AgentResult = AgentDone | AgentAwaitingClarification;
