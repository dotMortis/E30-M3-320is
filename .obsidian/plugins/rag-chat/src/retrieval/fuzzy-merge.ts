import { maxScore } from "./rrf";
import type { FuzzySearchHit, RetrievedHit } from "./types";

const HYBRID_LEG_WEIGHT = 0.7;
const FUZZY_LEG_WEIGHT = 0.3;

export function mergeWithFuzzy(hybridHits: RetrievedHit[], fuzzyHits: FuzzySearchHit[], topK: number): RetrievedHit[] {
  const maxHybrid = maxScore(hybridHits);
  const merged = new Map<string, RetrievedHit>();

  for (const h of hybridHits) {
    const normalized = maxHybrid > 0 ? h.score / maxHybrid : 0;
    merged.set(h.notePath, { ...h, score: normalized * HYBRID_LEG_WEIGHT });
  }

  const n = fuzzyHits.length;
  for (let i = 0; i < n; i++) {
    const f = fuzzyHits[i];
    const rankScore = n > 1 ? 1 - i / (n - 1) : 1;
    const contribution = rankScore * FUZZY_LEG_WEIGHT;
    const existing = merged.get(f.notePath);
    if (existing) {
      existing.score += contribution;
    } else {
      merged.set(f.notePath, {
        score: contribution,
        rowId: `${f.notePath}::fuzzy`,
        notePath: f.notePath,
        seitencode: f.seitencode,
        sektion: f.sektion,
        titel: f.titel,
        kind: "text",
      });
    }
  }

  return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, topK);
}
