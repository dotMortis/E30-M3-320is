import type { Vault } from "obsidian";
import type { GeminiContent, GroundingChunk, GroundingSupport } from "../gemini/types";
import type { CachedIndices, ContextBlock, FuzzySearchApi, WebCitation } from "../retrieval/types";
import type { RagChatSettings } from "../settings/types";

export interface AgentLoopContext {
  settings: RagChatSettings;
  vault: Vault;
  indices: CachedIndices;
  fuzzyApi: FuzzySearchApi | null;
  onStatus?: (status: string) => void;
  /**
   * Checked between rounds so an abandoned request (e.g. the view was
   * closed) stops making further model/tool calls instead of continuing to
   * burn API quota for a result nobody will see. Obsidian's `requestUrl` has
   * no cancellation support, so an already-in-flight HTTP call can't be
   * aborted mid-flight - this only stops the *next* round/call from
   * starting.
   */
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
