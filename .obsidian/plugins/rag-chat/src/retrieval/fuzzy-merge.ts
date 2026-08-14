import { rrfMerge } from "./rrf";
import { FUZZY_RANK_OFFSET } from "../constants";
import type { FuzzySearchHit, RetrievedHit } from "./types";

/**
 * Folds the fuzzy (vault-search) leg into the already-fused hybrid results
 * via the same Reciprocal Rank Fusion model used for text+vector (see
 * retrieval/rrf.ts), keyed by notePath rather than chunk rowId - a note can
 * have multiple hybrid chunks; the fuzzy leg only knows about whole notes.
 * `rrfK` is the same fusion constant used for the text/vector legs
 * (settings.rrfK), keeping a single tunable knob for all fusion stages.
 */
export function mergeWithFuzzy(
  hybridHits: RetrievedHit[],
  fuzzyHits: FuzzySearchHit[],
  topK: number,
  rrfK: number
): RetrievedHit[] {
  const hybridLeg = hybridHits.map((h, i) => ({ key: h.notePath, rank: i, item: h }));
  const fuzzyLeg = fuzzyHits.map((f, i) => ({
    key: f.notePath,
    rank: i + FUZZY_RANK_OFFSET,
    item: {
      score: 0,
      rowId: `${f.notePath}::fuzzy`,
      notePath: f.notePath,
      seitencode: f.seitencode,
      sektion: f.sektion,
      titel: f.titel,
      kind: "text" as const,
    },
  }));

  const merged = rrfMerge([hybridLeg, fuzzyLeg], rrfK);
  return merged.slice(0, topK).map(({ item, score }) => ({ ...item, score }));
}
