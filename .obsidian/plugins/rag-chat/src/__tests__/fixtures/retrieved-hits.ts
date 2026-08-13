import type { FuzzySearchHit, RetrievedHit } from "../../retrieval/types";

export function fakeHit(overrides: Partial<RetrievedHit> & { rowId: string }): RetrievedHit {
  return {
    score: 1,
    seitencode: "",
    sektion: "",
    titel: overrides.rowId,
    notePath: `${overrides.rowId}.md`,
    kind: "text",
    ...overrides,
  };
}

export function fakeFuzzyHit(overrides: Partial<FuzzySearchHit> & { notePath: string; rank: number }): FuzzySearchHit {
  return {
    seitencode: "",
    sektion: "",
    titel: overrides.notePath,
    ...overrides,
  };
}
