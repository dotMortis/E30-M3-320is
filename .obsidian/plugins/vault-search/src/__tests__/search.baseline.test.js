/**
 * search.baseline.test.js — golden/characterization tests for runSearch()
 * (see ../search.js), captured against the CURRENT (pre-optimization)
 * implementation over a small synthetic fixture vault (see
 * ./fixtures/notes.js). These pin down existing behaviour - result
 * ordering, snippet extraction, typo-tolerance escalation, and the
 * concept-coverage rerank documented in search.js's own comments - so that
 * the upcoming performance optimizations (debounce/cancel, bounded
 * fold(), lazy JSON load, parallel index build, caching) can be verified
 * not to silently change search results.
 *
 * Any test intentionally updated to reflect an approved behaviour change
 * (e.g. snippet windowing for very long notes, per the bounded-fold()
 * optimization) should say so in a comment at the point of change.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { runSearch } from "../search.js";
import { buildTestEngine } from "./helpers/buildEngine.js";
import { ALL_NOTES, FUEL_TITLE, FUEL_TANK_TITLE, FUEL_OVERVIEW, BRAKE_TITLE, BRAKE_MENTION } from "./fixtures/notes.js";

describe("runSearch baseline", () => {
  let engine;

  beforeAll(async () => {
    engine = await buildTestEngine(ALL_NOTES);
  });

  async function search(query, limit = 50) {
    return runSearch(
      engine.db,
      query,
      limit,
      engine.vocabulary,
      engine.contentByRowId,
      engine.synonymMap,
      engine.dict,
      engine.compoundParts
    );
  }

  it("returns empty results for an empty query", async () => {
    const { results, correction, expandedTerms } = await search("");
    expect(results).toEqual([]);
    expect(correction).toBeNull();
    expect(expandedTerms).toEqual([]);
  });

  it("returns no hits for a query with no vocabulary overlap", async () => {
    const { results } = await search("quantenmechanik");
    expect(results).toEqual([]);
  });

  it("ranks a title match above a content-only mention for the same term (field boost)", async () => {
    const { results } = await search("bremse");
    const paths = results.map((r) => r.notePath);
    expect(paths).toContain(BRAKE_TITLE.notePath);
    expect(paths).toContain(BRAKE_MENTION.notePath);
    expect(paths.indexOf(BRAKE_TITLE.notePath)).toBeLessThan(paths.indexOf(BRAKE_MENTION.notePath));
  });

  it("prefers a multi-concept title match over a single-concept-repeated title match (coverage rerank)", async () => {
    // Mirrors search.js's own documented "13-710" scenario: FUEL_TANK_TITLE
    // genuinely matches BOTH concepts ("kraftstoff" via its "Kraftstofftank"
    // title compound, and "einbauen" literally in its title) once each,
    // while FUEL_OVERVIEW only repeats "kraftstoff"/"kraftstoffanlage" and
    // never mentions "einbauen" anywhere. rerankByCoverage() should place
    // the genuine two-concept match ahead of the repeated-single-concept one.
    const { results } = await search("kraftstoff einbauen");
    const paths = results.map((r) => r.notePath);
    expect(paths).toContain(FUEL_TANK_TITLE.notePath);
    expect(paths).toContain(FUEL_OVERVIEW.notePath);
    expect(paths.indexOf(FUEL_TANK_TITLE.notePath)).toBeLessThan(paths.indexOf(FUEL_OVERVIEW.notePath));
  });

  it("does not let an incidental content-only verb mention count as concept coverage", async () => {
    // FUEL_TITLE mentions "einbauen" once, incidentally, deep in its content
    // body (its title/tags are only about "kraftstoff"/pressure-checking).
    // conceptCoverage() deliberately excludes body content, so this should
    // NOT be treated as a 2-concept match the way FUEL_TANK_TITLE is.
    const { results } = await search("kraftstoff einbauen");
    const tankResult = results.find((r) => r.notePath === FUEL_TANK_TITLE.notePath);
    const pressureResult = results.find((r) => r.notePath === FUEL_TITLE.notePath);
    expect(tankResult).toBeDefined();
    expect(pressureResult).toBeDefined();
    expect(tankResult.rank).toBeLessThan(pressureResult.rank);
  });

  it("expands a colloquial synonym (benzin -> kraftstoff) via COLLOQUIAL_GROUPS", async () => {
    const { results, expandedTerms } = await search("benzin");
    expect(expandedTerms).toContain("kraftstoff");
    const paths = results.map((r) => r.notePath);
    expect(paths).toContain(FUEL_TITLE.notePath);
  });

  it("bridges a separated separable-verb query to the literal infinitive (einbauen)", async () => {
    // "wie baue ich den tank ein" never contains the literal token
    // "einbauen" - synthesizeSeparableVerbs() must reconstruct it from the
    // "ein" prefix + "baue" stem, gated by the vocabulary built from
    // FUEL_TANK_TITLE's own content ("...Tank einbauen...").
    const { results, expandedTerms } = await search("wie baue ich den tank ein");
    expect(expandedTerms).toContain("einbauen");
    const paths = results.map((r) => r.notePath);
    expect(paths).toContain(FUEL_TANK_TITLE.notePath);
  });

  it("bridges a split compound query to the joined form (kraftstoff tank -> kraftstofftank)", async () => {
    const { expandedTerms } = await search("kraftstoff tank");
    expect(expandedTerms).toContain("kraftstofftank");
  });

  it("escalates typo tolerance to find a hit a tolerance-0 search would miss", async () => {
    // "Krafstoff" (missing the second "t") - tolerance 0 alone should not
    // literally match "kraftstoff", but escalation up to the
    // length-justified cap should still surface fuel-related notes and
    // report a correction hint.
    const { results, correction } = await search("Krafstoff");
    expect(results.length).toBeGreaterThan(0);
    expect(correction).not.toBeNull();
  });

  it("builds a non-empty snippet around the matched term, with a leading ellipsis when truncated", async () => {
    const { results } = await search("manometer");
    const hit = results.find((r) => r.notePath === FUEL_TITLE.notePath);
    expect(hit).toBeDefined();
    expect(hit.snippet.length).toBeGreaterThan(0);
    expect(hit.snippet.toLowerCase()).toContain("manometer");
  });

  it("returns an empty snippet for a note with no content", async () => {
    const { results } = await search("leere");
    const hit = results.find((r) => r.notePath === "03-sonstiges/99-002.md");
    expect(hit).toBeDefined();
    expect(hit.snippet).toBe("");
  });

  it("finds an exact page code as a literal token (notePath/code field)", async () => {
    const { results } = await search("13-710");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].notePath).toBe(FUEL_TITLE.notePath);
  });
});
