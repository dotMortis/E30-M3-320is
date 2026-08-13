import { describe, it, expect } from "vitest";
import { buildDictionary } from "../../german/dictionary.js";
import { buildSynonymMap } from "../../german/synonyms.js";
import { tokenize } from "../../german/fold.js";

describe("buildDictionary", () => {
  it("collects title/tag tokens and synonym-map keys, excluding stopwords/short tokens", () => {
    const synonymMap = buildSynonymMap([], [["schlauch", "rohr"]]);
    const dict = buildDictionary([tokenize("Kraftstofftank"), tokenize("und")], synonymMap);
    expect(dict.has("kraftstofftank")).toBe(true);
    expect(dict.has("schlauch")).toBe(true);
    expect(dict.has("und")).toBe(false);
  });
});
