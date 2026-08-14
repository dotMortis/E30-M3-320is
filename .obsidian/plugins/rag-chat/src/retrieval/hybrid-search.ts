import { search } from "@orama/orama";
import { rrfMerge } from "./rrf";
import type { RagMetadata } from "./orama-schema";
import type { RagChatSettings } from "../settings/types";
import type { CachedIndices, RetrievedHit } from "./types";
import { CANDIDATE_POOL_LIMIT } from "../constants";

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

  const textHitsSorted = [...textResult.hits].sort((a, b) => b.score - a.score);
  const vectorHitsSorted = [...vectorHits].sort((a, b) => b.score - a.score);

  const textLeg = textHitsSorted.map((h, i) => ({
    key: (h.document as unknown as RagMetadata).rowId,
    rank: i,
    item: h.document as unknown as RagMetadata,
  }));
  const vectorLeg = vectorHitsSorted.map((h, i) => ({
    key: (h.document as unknown as RagMetadata).rowId,
    rank: i,
    item: h.document as unknown as RagMetadata,
  }));

  const merged = rrfMerge([textLeg, vectorLeg], settings.rrfK);

  return merged.slice(0, settings.topK).map(({ score, item: doc }) => ({
    score,
    rowId: doc.rowId,
    notePath: doc.notePath,
    seitencode: doc.seitencode,
    sektion: doc.sektion,
    titel: doc.titel,
    kind: doc.kind,
  }));
}
