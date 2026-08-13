import type { RagMetadata } from "./orama-schema";

export function rrfMerge(
  textHitsSorted: { document: RagMetadata; score: number }[],
  vectorHitsSorted: { document: RagMetadata; score: number }[],
  k: number
): { score: number; doc: RagMetadata }[] {
  const scores = new Map<string, { score: number; doc: RagMetadata }>();
  textHitsSorted.forEach((h, i) => {
    const rowId = h.document.rowId;
    const existing = scores.get(rowId);
    scores.set(rowId, { score: (existing?.score ?? 0) + 1 / (k + i + 1), doc: existing?.doc ?? h.document });
  });
  vectorHitsSorted.forEach((h, i) => {
    const rowId = h.document.rowId;
    const existing = scores.get(rowId);
    scores.set(rowId, { score: (existing?.score ?? 0) + 1 / (k + i + 1), doc: existing?.doc ?? h.document });
  });
  return [...scores.values()].sort((a, b) => b.score - a.score);
}

export function maxScore(hits: { score: number }[]): number {
  return hits.reduce((m, h) => Math.max(m, h.score), 0);
}
