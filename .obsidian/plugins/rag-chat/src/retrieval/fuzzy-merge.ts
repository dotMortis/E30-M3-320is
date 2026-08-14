import { rrfMerge } from "./rrf";
import { FUZZY_RANK_OFFSET } from "../constants";
import type { FuzzySearchHit, RetrievedHit } from "./types";

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
