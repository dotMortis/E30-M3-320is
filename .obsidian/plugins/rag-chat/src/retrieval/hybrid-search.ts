import { search } from "@orama/orama";
import { rrfMerge } from "./rrf";
import type { RagMetadata } from "./orama-schema";
import type { RagChatSettings } from "../settings/types";
import type { CachedIndices, RetrievedHit } from "./types";

const CANDIDATE_POOL_LIMIT = 5000;

export async function federatedHybridSearch(
  indices: CachedIndices,
  term: string,
  vector: number[],
  settings: RagChatSettings
): Promise<RetrievedHit[]> {
  const textResult = await search(indices.textDb, {
    mode: "fulltext",
    term,
    limit: CANDIDATE_POOL_LIMIT,
  });

  const vectorResultsPerShard = await Promise.all(
    indices.vectorDbs.map((db) =>
      search(db, {
        mode: "vector",
        vector: { value: vector, property: "embedding" },
        similarity: settings.similarity,
        limit: CANDIDATE_POOL_LIMIT,
      })
    )
  );
  const vectorHits = vectorResultsPerShard.flatMap((r) => r.hits);

  const textHitsSorted = [...textResult.hits]
    .sort((a, b) => b.score - a.score)
    .map((h) => ({ document: h.document as unknown as RagMetadata, score: h.score }));
  const vectorHitsSorted = [...vectorHits]
    .sort((a, b) => b.score - a.score)
    .map((h) => ({ document: h.document as unknown as RagMetadata, score: h.score }));

  const merged = rrfMerge(textHitsSorted, vectorHitsSorted, settings.rrfK);

  return merged.slice(0, settings.topK).map(({ score, doc }) => ({
    score,
    rowId: doc.rowId,
    notePath: doc.notePath,
    seitencode: doc.seitencode,
    sektion: doc.sektion,
    titel: doc.titel,
    kind: doc.kind,
  }));
}
