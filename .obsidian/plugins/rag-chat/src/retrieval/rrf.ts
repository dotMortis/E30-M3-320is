/**
 * A single leg's contribution to a Reciprocal Rank Fusion merge: an item
 * identified by `key` (the fusion identity - e.g. a chunk rowId or a
 * notePath, depending on what's being fused), at position `rank` (0-based,
 * best first) within that leg's own ranking.
 */
export interface RrfLegEntry<T> {
  key: string;
  rank: number;
  item: T;
}

/**
 * Fuses any number of independently-ranked legs (text search, vector search,
 * fuzzy search, ...) into a single ranking via Reciprocal Rank Fusion: each
 * leg contributes 1/(k + rank + 1) to every key it contains, summed across
 * legs. This is the single fusion model used everywhere in the retrieval
 * pipeline - see retrieval/hybrid-search.ts (text + vector legs, keyed by
 * chunk rowId) and retrieval/fuzzy-merge.ts (hybrid + fuzzy legs, keyed by
 * notePath).
 *
 * When multiple entries across (or within) legs share the same key, the
 * first one encountered (in leg order, then array order) wins as the
 * returned `item` - since legs are expected to be pre-sorted best-first,
 * this keeps the best-scoring/highest-ranked item for a given key rather
 * than an arbitrary later (worse) duplicate.
 */
export function rrfMerge<T>(legs: RrfLegEntry<T>[][], k: number): { key: string; item: T; score: number }[] {
  const scores = new Map<string, { score: number; item: T }>();
  for (const leg of legs) {
    for (const entry of leg) {
      const existing = scores.get(entry.key);
      const score = (existing?.score ?? 0) + 1 / (k + entry.rank + 1);
      scores.set(entry.key, { score, item: existing?.item ?? entry.item });
    }
  }
  return [...scores.entries()]
    .map(([key, v]) => ({ key, item: v.item, score: v.score }))
    .sort((a, b) => b.score - a.score);
}
