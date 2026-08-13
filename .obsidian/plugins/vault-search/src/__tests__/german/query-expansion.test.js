import { describe, it, expect } from "vitest";
import { expandQuery, expandQueryConcepts } from "../../german/query-expansion.js";
import { buildSynonymMap } from "../../german/synonyms.js";

describe("expandQuery", () => {
  it("includes literal content tokens and excludes stopwords", () => {
    const synonymMap = new Map();
    const dict = new Set();
    const expanded = expandQuery("wie funktioniert die bremse", synonymMap, dict, new Set(), {});
    expect(expanded).toContain("bremse");
    expect(expanded).not.toContain("wie");
    expect(expanded).not.toContain("die");
  });

  it("prefers a precomputed compound split over live decompound()", () => {
    const synonymMap = new Map();
    const dict = new Set();
    const compoundParts = { kraftstofftank: ["kraftstoff", "tank"] };
    const expanded = expandQuery("kraftstofftank", synonymMap, dict, new Set(), compoundParts);
    expect(expanded).toEqual(expect.arrayContaining(["kraftstoff", "tank"]));
  });

  it("skips decompounding when a curated synonym already matched", () => {
    const synonymMap = buildSynonymMap([], []);
    const dict = new Set(["keil", "riemen"]);
    const expanded = expandQuery("keilriemen", synonymMap, dict, new Set(), {});
    expect(expanded).toContain("antriebsriemen");
    expect(expanded).not.toContain("keil");
  });
});

describe("expandQueryConcepts", () => {
  it("groups terms by originating concept, one per distinct content word", () => {
    const synonymMap = buildSynonymMap([], []);
    const dict = new Set();
    const concepts = expandQueryConcepts("benzin einbauen", synonymMap, dict, new Set(["einbauen"]), {});
    expect(concepts.map((concept) => concept.raw)).toEqual(["benzin", "einbauen"]);
    const benzinConcept = concepts.find((concept) => concept.raw === "benzin");
    expect(benzinConcept.terms).toContain("kraftstoff");
  });

  it("returns a single concept (no grouping needed) for a one-word query", () => {
    const concepts = expandQueryConcepts("bremse", new Map(), new Set(), new Set(), {});
    expect(concepts.length).toBe(1);
    expect(concepts[0].raw).toBe("bremse");
  });
});
