/**
 * search.snippet-optimization.test.js — targeted tests for the bounded/
 * chunked fold() behaviour in snippetFor() (see ../search.js, optimization
 * #2 in the plan). Kept separate from search.baseline.test.js because
 * these specifically exercise the outlier-length-note code paths (chunk
 * boundary, overlap, and the hard scan cap) that the fixture notes in
 * ./fixtures/notes.js are deliberately too short to reach - all of THOSE
 * stay byte-identical before/after this optimization (verified by
 * search.baseline.test.js passing unchanged).
 */
import { describe, it, expect } from "vitest";
import { runSearch } from "../search.js";
import { buildTestEngine } from "./helpers/buildEngine.js";

const CHUNK_SIZE = 4000; // mirrors SNIPPET_SCAN_CHUNK_SIZE in search.js
const MAX_SCAN = 40000; // mirrors SNIPPET_MAX_SCAN_CHARS in search.js

function makeLongNote(rowId, matchWord, matchOffset) {
  const phrase = "Fuellwort ohne Bedeutung fuer die Suche. ";
  const filler = phrase.repeat(Math.ceil((matchOffset + phrase.length) / phrase.length));
  const before = filler.slice(0, matchOffset);
  const content = `${before}${matchWord} am Ende des langen Textabschnitts.${filler}`;
  return {
    rowId,
    notePath: `${rowId}.md`,
    code: "",
    titel: "Langer Testartikel",
    titleEn: "",
    section: "Test",
    tags: ["testartikel"],
    content,
  };
}

describe("snippetFor bounded scan (optimization #2)", () => {
  async function searchFor(notes, query) {
    const engine = await buildTestEngine(notes);
    return runSearch(
      engine.db,
      query,
      50,
      engine.vocabulary,
      engine.contentByRowId,
      engine.synonymMap,
      engine.dict,
      engine.compoundParts
    );
  }

  it("finds a match that falls exactly on a chunk boundary (overlap logic)", async () => {
    // Place the match straddling the CHUNK_SIZE boundary so it's only
    // findable if the overlap window between consecutive chunks works.
    const note = makeLongNote("boundary-note", "kraftstoffpumpe", CHUNK_SIZE - 5);
    const { results } = await searchFor([note], "testartikel kraftstoffpumpe");
    const hit = results.find((r) => r.notePath === "boundary-note.md");
    expect(hit).toBeDefined();
    expect(hit.snippet.toLowerCase()).toContain("kraftstoffpumpe");
  });

  it("finds a match several chunks into a long note", async () => {
    const note = makeLongNote("deep-note", "kraftstoffpumpe", CHUNK_SIZE * 3 + 100);
    const { results } = await searchFor([note], "testartikel kraftstoffpumpe");
    const hit = results.find((r) => r.notePath === "deep-note.md");
    expect(hit).toBeDefined();
    expect(hit.snippet.toLowerCase()).toContain("kraftstoffpumpe");
  });

  it("(accepted drift) returns no snippet when the only match is beyond SNIPPET_MAX_SCAN_CHARS", async () => {
    // Documented trade-off from the optimization plan: Orama still finds
    // and ranks the doc via title/tags (it's still a hit with rank/score),
    // but the body snippet is dropped once the match sits past the hard
    // scan cap, in exchange for not folding the entire (huge) note body on
    // every search for every hit.
    const note = makeLongNote("too-deep-note", "kraftstoffpumpe", MAX_SCAN + 500);
    const { results } = await searchFor([note], "testartikel kraftstoffpumpe");
    const hit = results.find((r) => r.notePath === "too-deep-note.md");
    expect(hit).toBeDefined(); // still a real search hit (title/tag match)
    expect(hit.snippet).toBe(""); // but no snippet - the term is unreachable
  });
});
