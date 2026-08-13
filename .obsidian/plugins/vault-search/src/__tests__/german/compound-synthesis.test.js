import { describe, it, expect } from "vitest";
import { synthesizeJoinedCompounds } from "../../german/compound-synthesis.js";

describe("synthesizeJoinedCompounds", () => {
  it("joins adjacent content words with a valid Fugenelement when gated by vocabulary", () => {
    const vocabulary = new Set(["kraftstofftank"]);
    expect(synthesizeJoinedCompounds(["kraftstoff", "tank"], vocabulary)).toEqual(["kraftstofftank"]);
  });

  it("returns nothing when the joined form is not in vocabulary", () => {
    expect(synthesizeJoinedCompounds(["kraftstoff", "tank"], new Set())).toEqual([]);
  });
});
