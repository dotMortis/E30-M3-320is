import type { RagManifest } from "../../retrieval/types";

export function fakeManifest(overrides: Partial<RagManifest> = {}): RagManifest {
  return {
    embeddingModel: "gemini-embedding-2",
    embeddingDims: 3072,
    docPrefixTemplate: "task: search document | title: {title} | text: {content}",
    queryPrefixTemplate: "task: search result | query: {content}",
    generationModel: "gemini-3.6-flash",
    noteCount: 2822,
    textChunkCount: 2822,
    multimodalCount: 0,
    referenceChunkCount: 40,
    referenceDocCount: 4,
    referenceChunksFile: "reference-chunks.json",
    totalRowCount: 2862,
    textIndexFile: "rag-index-text.orama.msp",
    textIndexBytes: 17_774_923,
    vectorShardCount: 3,
    vectorIndexFilePattern: "rag-index-vectors-{i}.orama.msp",
    vectorShardBytes: [57_664_915, 57_545_988, 57_345_591],
    corpusHash: "fake-corpus-hash",
    chunkedAt: "2026-08-01T00:00:00Z",
    builtAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}
