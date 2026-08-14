import { describe, expect, it } from "vitest";
import { rrfMerge } from "../../retrieval/rrf";

describe("rrfMerge", () => {
  it("returns an empty array when there are no legs", () => {
    expect(rrfMerge([], 2)).toEqual([]);
  });

  it("returns an empty array when all legs are empty", () => {
    expect(rrfMerge([[], []], 2)).toEqual([]);
  });

  it("scores a key present only in one leg using 1/(k + rank + 1)", () => {
    const result = rrfMerge([[{ key: "a", rank: 0, item: "doc-a" }]], 2);
    expect(result).toEqual([{ key: "a", item: "doc-a", score: 1 / 3 }]);
  });

  it("sums contributions from multiple legs for the same key", () => {
    const result = rrfMerge(
      [
        [{ key: "a", rank: 0, item: "from-leg-1" }],
        [{ key: "a", rank: 0, item: "from-leg-2" }],
      ],
      2
    );
    expect(result).toEqual([{ key: "a", item: "from-leg-1", score: 1 / 3 + 1 / 3 }]);
  });

  it("gives a key exclusive to one leg a fixed contribution independent of other legs' size", () => {
    const soloWinner = rrfMerge([[{ key: "solo", rank: 0, item: "solo" }]], 2);
    const withUnrelatedLeg = rrfMerge(
      [
        [{ key: "solo", rank: 0, item: "solo" }],
        [
          { key: "unrelated-1", rank: 0, item: "unrelated-1" },
          { key: "unrelated-2", rank: 1, item: "unrelated-2" },
        ],
      ],
      2
    );
    const soloScore = soloWinner.find((r) => r.key === "solo")!.score;
    const soloScoreWithNoise = withUnrelatedLeg.find((r) => r.key === "solo")!.score;
    expect(soloScoreWithNoise).toBe(soloScore);
  });

  it("sorts results by descending score", () => {
    const leg = [
      { key: "a", rank: 0, item: "a" },
      { key: "b", rank: 1, item: "b" },
    ];
    const result = rrfMerge([leg], 2);
    expect(result[0].key).toBe("a");
    expect(result[1].key).toBe("b");
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it("respects rank position (rank 0 contributes 1/(k+1), rank 1 contributes 1/(k+2))", () => {
    const leg = [
      { key: "first", rank: 0, item: "first" },
      { key: "second", rank: 1, item: "second" },
    ];
    const result = rrfMerge([leg], 3);
    const first = result.find((r) => r.key === "first")!;
    const second = result.find((r) => r.key === "second")!;
    expect(first.score).toBeCloseTo(1 / 4);
    expect(second.score).toBeCloseTo(1 / 5);
  });

  it("uses the item from the first leg that introduced the key (first occurrence wins)", () => {
    const result = rrfMerge(
      [
        [{ key: "a", rank: 0, item: "from-first-leg" }],
        [{ key: "a", rank: 0, item: "from-second-leg" }],
      ],
      2
    );
    expect(result[0].item).toBe("from-first-leg");
  });

  it("within a single leg, keeps the first (best-ranked) item for a duplicate key rather than a later one", () => {
    // Regression coverage for the old fuzzy-merge dedup bug: when a leg's own
    // array contains the same key twice (e.g. two chunks of the same note),
    // the earlier (better-ranked) occurrence must win, not the later one.
    const leg = [
      { key: "note.md", rank: 0, item: "best-chunk" },
      { key: "note.md", rank: 1, item: "worse-chunk" },
    ];
    const result = rrfMerge([leg], 2);
    expect(result).toHaveLength(1);
    expect(result[0].item).toBe("best-chunk");
    // Both occurrences still contribute to the score.
    expect(result[0].score).toBeCloseTo(1 / 3 + 1 / 4);
  });
});
