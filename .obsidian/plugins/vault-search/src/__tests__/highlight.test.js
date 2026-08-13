import { describe, it, expect } from "vitest";
import { findTermRanges } from "../highlight.js";

describe("findTermRanges", () => {
  it("finds a simple literal term and returns [start, end) ranges", () => {
    const ranges = findTermRanges("Kraftstoffdruck pruefen", ["kraftstoff"]);
    expect(ranges).toEqual([[0, 10]]);
  });

  it("maps ranges correctly through umlaut expansion (folded length != original length)", () => {
    const ranges = findTermRanges("Kühler pruefen", ["kuehler"]);
    expect(ranges).toEqual([[0, 6]]);
  });

  it("ignores terms shorter than 2 characters", () => {
    expect(findTermRanges("Kraftstoff", ["k"])).toEqual([]);
  });

  it("merges overlapping/adjacent ranges from multiple terms", () => {
    const ranges = findTermRanges("Kraftstofftank", ["kraftstoff", "stofftank"]);
    expect(ranges).toEqual([[0, 14]]);
  });

  it("returns an empty array for empty text or no terms", () => {
    expect(findTermRanges("", ["foo"])).toEqual([]);
    expect(findTermRanges("Kraftstoff", [])).toEqual([]);
  });

  it("finds multiple non-overlapping occurrences", () => {
    const ranges = findTermRanges("bremse vorne, bremse hinten", ["bremse"]);
    expect(ranges).toEqual([
      [0, 6],
      [14, 20],
    ]);
  });
});
