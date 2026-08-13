import type { AnyOrama } from "@orama/orama";
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

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  status?: string;
  statusLog?: string[];
  citations?: ContextBlock[];
  webCitations?: WebCitation[];
  webGroundingChunks?: GroundingChunk[];
  webGroundingSupports?: GroundingSupport[];
  isClarifying?: boolean;
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
