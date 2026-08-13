import { describe, it, expect } from "vitest";
import { runSearch } from "../../search.js";
import { buildTestEngine } from "../helpers/buildEngine.js";

const CHUNK_SIZE = 4000;
const MAX_SCAN = 40000;

/**
 * @param {string} rowId
 * @param {string} matchWord
 * @param {number} matchOffset
 * @returns {object}
 */
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

describe("snippetFor bounded scan", () => {
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

  it("returns no snippet when the only match is beyond the max scan length", async () => {
    const note = makeLongNote("too-deep-note", "kraftstoffpumpe", MAX_SCAN + 500);
    const { results } = await searchFor([note], "testartikel kraftstoffpumpe");
    const hit = results.find((r) => r.notePath === "too-deep-note.md");
    expect(hit).toBeDefined();
    expect(hit.snippet).toBe("");
  });
});
