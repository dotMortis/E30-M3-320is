import { describe, expect, it } from "vitest";
import { mergeWithFuzzy } from "../../retrieval/fuzzy-merge";
import { fakeFuzzyHit, fakeHit } from "../fixtures/retrieved-hits";

describe("mergeWithFuzzy", () => {
  it("returns hybrid-only hits (RRF-scored) when there are no fuzzy hits", () => {
    const hybrid = [fakeHit({ rowId: "a", notePath: "a.md", score: 10 }), fakeHit({ rowId: "b", notePath: "b.md", score: 5 })];
    const result = mergeWithFuzzy(hybrid, [], 10, 2);
    expect(result.map((h) => h.notePath)).toEqual(["a.md", "b.md"]);
    expect(result[0].score).toBeCloseTo(1 / 3);
    expect(result[1].score).toBeCloseTo(1 / 4);
  });

  it("returns an empty array when both inputs are empty", () => {
    expect(mergeWithFuzzy([], [], 10, 2)).toEqual([]);
  });

  it("adds a fuzzy-only hit not present in the hybrid results", () => {
    const hybrid = [fakeHit({ rowId: "a", notePath: "a.md", score: 10 })];
    const fuzzy = [fakeFuzzyHit({ notePath: "tank.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank einbauen", rank: 0 })];
    const result = mergeWithFuzzy(hybrid, fuzzy, 10, 2);
    const tankHit = result.find((h) => h.notePath === "tank.md");
    expect(tankHit).toBeDefined();
    expect(tankHit!.rowId).toBe("tank.md::fuzzy");
    expect(tankHit!.kind).toBe("text");
    expect(tankHit!.score).toBeCloseTo(1 / 3);
  });

  it("sums the fuzzy leg's contribution into an existing hybrid hit sharing the same notePath", () => {
    const hybrid = [fakeHit({ rowId: "a", notePath: "a.md", score: 10 })];
    const fuzzy = [fakeFuzzyHit({ notePath: "a.md", rank: 0 })];
    const result = mergeWithFuzzy(hybrid, fuzzy, 10, 2);
    expect(result[0].notePath).toBe("a.md");

    expect(result[0].score).toBeCloseTo(1 / 3 + 1 / 3);

    expect(result[0].rowId).toBe("a");
  });

  it("keeps the best (first, highest-ranked) hybrid chunk when two hybrid hits share a notePath", () => {

    const hybrid = [
      fakeHit({ rowId: "note.md#best", notePath: "note.md", score: 10 }),
      fakeHit({ rowId: "note.md#worse", notePath: "note.md", score: 1 }),
    ];
    const result = mergeWithFuzzy(hybrid, [], 10, 2);
    expect(result).toHaveLength(1);
    expect(result[0].rowId).toBe("note.md#best");
  });

  it("derives the fuzzy rank score from array position, best match first at rank 0", () => {
    const fuzzy = [
      fakeFuzzyHit({ notePath: "first.md", rank: 0 }),
      fakeFuzzyHit({ notePath: "middle.md", rank: 1 }),
      fakeFuzzyHit({ notePath: "last.md", rank: 2 }),
    ];
    const result = mergeWithFuzzy([], fuzzy, 10, 2);
    const first = result.find((h) => h.notePath === "first.md")!;
    const last = result.find((h) => h.notePath === "last.md")!;
    expect(first.score).toBeGreaterThan(last.score);
  });

  it("sorts the merged result by descending score (hybridHits is expected pre-sorted best-first)", () => {
    const hybrid = [
      fakeHit({ rowId: "high", notePath: "high.md", score: 10 }),
      fakeHit({ rowId: "low", notePath: "low.md", score: 1 }),
    ];
    const result = mergeWithFuzzy(hybrid, [], 10, 2);
    expect(result[0].notePath).toBe("high.md");
    expect(result[1].notePath).toBe("low.md");
  });

  it("respects topK when slicing the final merged list", () => {
    const fuzzy = [
      fakeFuzzyHit({ notePath: "a.md", rank: 0 }),
      fakeFuzzyHit({ notePath: "b.md", rank: 1 }),
      fakeFuzzyHit({ notePath: "c.md", rank: 2 }),
    ];
    const result = mergeWithFuzzy([], fuzzy, 2, 2);
    expect(result).toHaveLength(2);
  });

  it("respects the rrfK fusion constant (larger k compresses rank differences)", () => {
    const hybrid = [fakeHit({ rowId: "a", notePath: "a.md", score: 10 }), fakeHit({ rowId: "b", notePath: "b.md", score: 5 })];
    const tightK = mergeWithFuzzy(hybrid, [], 10, 1);
    const looseK = mergeWithFuzzy(hybrid, [], 10, 60);
    const tightGap = tightK[0].score - tightK[1].score;
    const looseGap = looseK[0].score - looseK[1].score;
    expect(looseGap).toBeLessThan(tightGap);
  });

  it("carries through seitencode/sektion/titel from the fuzzy hit for a fuzzy-only result", () => {
    const fuzzy = [fakeFuzzyHit({ notePath: "tank.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank einbauen", rank: 0 })];
    const result = mergeWithFuzzy([], fuzzy, 10, 2);
    expect(result[0]).toMatchObject({ seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank einbauen" });
  });
});
