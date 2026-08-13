import { describe, it, expect } from "vitest";
import { buildSynonymMap, expandSynonyms } from "../../german/synonyms.js";

describe("buildSynonymMap / expandSynonyms", () => {
  it("links COLLOQUIAL_GROUPS bidirectionally", () => {
    const map = buildSynonymMap([], []);
    expect(expandSynonyms(map, "benzin")).toContain("kraftstoff");
    expect(expandSynonyms(map, "kraftstoff")).toContain("benzin");
  });

  it("links glossary de/en/variants (single-token phrases only)", () => {
    const map = buildSynonymMap([{ de: "keilriemen", en: "vbelt", variants: ["antriebsriemen"] }], []);
    expect(expandSynonyms(map, "keilriemen")).toEqual(
      expect.arrayContaining(["vbelt", "antriebsriemen", "riemen"])
    );
  });

  it("links pre-folded OpenThesaurus-style pairs directly", () => {
    const map = buildSynonymMap([], [["foo", "bar"]]);
    expect(expandSynonyms(map, "foo")).toEqual(["bar"]);
    expect(expandSynonyms(map, "bar")).toEqual(["foo"]);
  });

  it("never links a stopword", () => {
    const map = buildSynonymMap([], [["und", "bar"]]);
    expect(expandSynonyms(map, "und")).toEqual([]);
  });
});
