export interface RrfLegEntry<T> {
  key: string;
  rank: number;
  item: T;
}

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
