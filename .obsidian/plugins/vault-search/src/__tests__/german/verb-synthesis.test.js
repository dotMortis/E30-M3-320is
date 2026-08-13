import { describe, it, expect } from "vitest";
import { verbStemCandidates, synthesizeSeparableVerbs } from "../../german/verb-synthesis.js";
import { tokenize } from "../../german/fold.js";

describe("verbStemCandidates", () => {
  it("strips common present-tense endings and keeps the original word", () => {
    const stems = verbStemCandidates("baue");
    expect(stems.has("baue")).toBe(true);
    expect(stems.has("bau")).toBe(true);
  });
});

describe("synthesizeSeparableVerbs", () => {
  it("bridges a separated prefix+verb to the literal infinitive when gated by vocabulary", () => {
    const vocabulary = new Set(["einbauen"]);
    const tokens = tokenize("wie baue ich den tank ein");
    expect(synthesizeSeparableVerbs(tokens, vocabulary)).toEqual(["einbauen"]);
  });

  it("returns nothing when the candidate is not in vocabulary", () => {
    const vocabulary = new Set(["irgendwas"]);
    const tokens = tokenize("wie baue ich den tank ein");
    expect(synthesizeSeparableVerbs(tokens, vocabulary)).toEqual([]);
  });

  it("returns nothing when no separable prefix is present in the query", () => {
    const vocabulary = new Set(["einbauen"]);
    const tokens = tokenize("tank pruefen");
    expect(synthesizeSeparableVerbs(tokens, vocabulary)).toEqual([]);
  });
});
