import { describe, expect, it } from "vitest";
import { mergeWithFuzzy } from "../../retrieval/fuzzy-merge";
import { fakeFuzzyHit, fakeHit } from "../fixtures/retrieved-hits";

describe("mergeWithFuzzy", () => {
  it("returns hybrid-only hits normalized when there are no fuzzy hits", () => {
    const hybrid = [fakeHit({ rowId: "a", notePath: "a.md", score: 10 }), fakeHit({ rowId: "b", notePath: "b.md", score: 5 })];
    const result = mergeWithFuzzy(hybrid, [], 10);
    expect(result[0].score).toBeCloseTo(1 * 0.7);
    expect(result[1].score).toBeCloseTo(0.5 * 0.7);
  });

  it("returns an empty array when both inputs are empty", () => {
    expect(mergeWithFuzzy([], [], 10)).toEqual([]);
  });

  it("adds a fuzzy-only hit not present in the hybrid results", () => {
    const hybrid = [fakeHit({ rowId: "a", notePath: "a.md", score: 10 })];
    const fuzzy = [fakeFuzzyHit({ notePath: "tank.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank einbauen", rank: 0 })];
    const result = mergeWithFuzzy(hybrid, fuzzy, 10);
    const tankHit = result.find((h) => h.notePath === "tank.md");
    expect(tankHit).toBeDefined();
    expect(tankHit!.rowId).toBe("tank.md::fuzzy");
    expect(tankHit!.kind).toBe("text");
    expect(tankHit!.score).toBeCloseTo(1 * 0.3);
  });

  it("adds the fuzzy contribution to an existing hybrid hit sharing the same notePath", () => {
    const hybrid = [fakeHit({ rowId: "a", notePath: "a.md", score: 10 })];
    const fuzzy = [fakeFuzzyHit({ notePath: "a.md", rank: 0 })];
    const result = mergeWithFuzzy(hybrid, fuzzy, 10);
    expect(result[0].notePath).toBe("a.md");
    expect(result[0].score).toBeCloseTo(1 * 0.7 + 1 * 0.3);
  });

  it("derives the fuzzy rank score from position, best match first at rank 0", () => {
    const fuzzy = [
      fakeFuzzyHit({ notePath: "first.md", rank: 0 }),
      fakeFuzzyHit({ notePath: "middle.md", rank: 1 }),
      fakeFuzzyHit({ notePath: "last.md", rank: 2 }),
    ];
    const result = mergeWithFuzzy([], fuzzy, 10);
    const first = result.find((h) => h.notePath === "first.md")!;
    const last = result.find((h) => h.notePath === "last.md")!;
    expect(first.score).toBeCloseTo(1 * 0.3);
    expect(last.score).toBeCloseTo(0 * 0.3);
  });

  it("gives a single fuzzy hit the full rank score of 1 (avoids division by zero)", () => {
    const result = mergeWithFuzzy([], [fakeFuzzyHit({ notePath: "only.md", rank: 0 })], 10);
    expect(result[0].score).toBeCloseTo(0.3);
  });

  it("normalizes hybrid scores against the max hybrid score before weighting", () => {
    const hybrid = [fakeHit({ rowId: "a", notePath: "a.md", score: 4 }), fakeHit({ rowId: "b", notePath: "b.md", score: 2 })];
    const result = mergeWithFuzzy(hybrid, [], 10);
    const a = result.find((h) => h.notePath === "a.md")!;
    const b = result.find((h) => h.notePath === "b.md")!;
    expect(a.score).toBeCloseTo(0.7);
    expect(b.score).toBeCloseTo(0.35);
  });

  it("treats all-zero hybrid scores as normalized to 0 rather than dividing by zero", () => {
    const hybrid = [fakeHit({ rowId: "a", notePath: "a.md", score: 0 })];
    const result = mergeWithFuzzy(hybrid, [], 10);
    expect(result[0].score).toBe(0);
  });

  it("sorts the merged result by descending score", () => {
    const hybrid = [
      fakeHit({ rowId: "low", notePath: "low.md", score: 1 }),
      fakeHit({ rowId: "high", notePath: "high.md", score: 10 }),
    ];
    const result = mergeWithFuzzy(hybrid, [], 10);
    expect(result[0].notePath).toBe("high.md");
    expect(result[1].notePath).toBe("low.md");
  });

  it("respects topK when slicing the final merged list", () => {
    const fuzzy = [
      fakeFuzzyHit({ notePath: "a.md", rank: 0 }),
      fakeFuzzyHit({ notePath: "b.md", rank: 1 }),
      fakeFuzzyHit({ notePath: "c.md", rank: 2 }),
    ];
    const result = mergeWithFuzzy([], fuzzy, 2);
    expect(result).toHaveLength(2);
  });

  it("carries through seitencode/sektion/titel from the fuzzy hit for a fuzzy-only result", () => {
    const fuzzy = [fakeFuzzyHit({ notePath: "tank.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank einbauen", rank: 0 })];
    const result = mergeWithFuzzy([], fuzzy, 10);
    expect(result[0]).toMatchObject({ seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank einbauen" });
  });
});
