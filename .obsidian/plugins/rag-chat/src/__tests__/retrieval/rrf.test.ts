import { describe, expect, it } from "vitest";
import { maxScore, rrfMerge } from "../../retrieval/rrf";
import type { RagMetadata } from "../../retrieval/orama-schema";

function doc(rowId: string): RagMetadata {
  return {
    rowId,
    seitencode: "",
    sektionNr: "",
    sektion: "",
    titel: rowId,
    tags: [],
    notePath: `${rowId}.md`,
    bilddatei: "",
    kind: "text",
  };
}

describe("rrfMerge", () => {
  it("returns an empty array when both legs are empty", () => {
    expect(rrfMerge([], [], 2)).toEqual([]);
  });

  it("scores a rowId present only in the text leg using 1/(k + rank)", () => {
    const result = rrfMerge([{ document: doc("a"), score: 10 }], [], 2);
    expect(result).toEqual([{ score: 1 / 3, doc: doc("a") }]);
  });

  it("scores a rowId present only in the vector leg using 1/(k + rank)", () => {
    const result = rrfMerge([], [{ document: doc("a"), score: 0.9 }], 2);
    expect(result).toEqual([{ score: 1 / 3, doc: doc("a") }]);
  });

  it("sums contributions from both legs for a rowId present in both", () => {
    const result = rrfMerge([{ document: doc("a"), score: 10 }], [{ document: doc("a"), score: 0.9 }], 2);
    expect(result).toEqual([{ score: 1 / 3 + 1 / 3, doc: doc("a") }]);
  });

  it("gives a document exclusive to one leg a fixed contribution independent of the other leg's ranking size", () => {
    const soloWinner = rrfMerge([{ document: doc("solo"), score: 100 }], [], 2);
    const withUnrelatedVectorLeg = rrfMerge(
      [{ document: doc("solo"), score: 100 }],
      [{ document: doc("unrelated-1"), score: 0.9 }, { document: doc("unrelated-2"), score: 0.8 }],
      2
    );
    const soloScore = soloWinner.find((r) => r.doc.rowId === "solo")!.score;
    const soloScoreWithNoise = withUnrelatedVectorLeg.find((r) => r.doc.rowId === "solo")!.score;
    expect(soloScoreWithNoise).toBe(soloScore);
  });

  it("sorts results by descending score", () => {
    const textLeg = [{ document: doc("a"), score: 1 }, { document: doc("b"), score: 0.5 }];
    const result = rrfMerge(textLeg, [], 2);
    expect(result[0].doc.rowId).toBe("a");
    expect(result[1].doc.rowId).toBe("b");
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it("respects 1-based rank position (first hit contributes 1/(k+1), second 1/(k+2))", () => {
    const textLeg = [{ document: doc("first"), score: 5 }, { document: doc("second"), score: 4 }];
    const result = rrfMerge(textLeg, [], 3);
    const first = result.find((r) => r.doc.rowId === "first")!;
    const second = result.find((r) => r.doc.rowId === "second")!;
    expect(first.score).toBeCloseTo(1 / 4);
    expect(second.score).toBeCloseTo(1 / 5);
  });

  it("uses the document from the first leg that introduced the rowId", () => {
    const textDoc = { ...doc("a"), titel: "from-text-leg" };
    const vectorDoc = { ...doc("a"), titel: "from-vector-leg" };
    const result = rrfMerge([{ document: textDoc, score: 1 }], [{ document: vectorDoc, score: 1 }], 2);
    expect(result[0].doc.titel).toBe("from-text-leg");
  });
});

describe("maxScore", () => {
  it("returns 0 for an empty array", () => {
    expect(maxScore([])).toBe(0);
  });

  it("returns the highest score among the hits", () => {
    expect(maxScore([{ score: 0.2 }, { score: 0.9 }, { score: 0.5 }])).toBe(0.9);
  });

  it("returns 0 when all scores are negative or zero (never goes below the initial 0 accumulator)", () => {
    expect(maxScore([{ score: -5 }, { score: -1 }])).toBe(0);
  });
});
