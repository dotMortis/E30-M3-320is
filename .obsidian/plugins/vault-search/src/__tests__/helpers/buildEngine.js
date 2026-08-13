/**
 * buildEngine.js — test harness that replicates SearchEngine._build()'s
 * index-construction logic (see ../../main.js:68-127) over a fixed array
 * of in-memory fixture notes, WITHOUT any Obsidian vault I/O. Kept as a
 * faithful mirror of the production build steps (same field extraction,
 * same vocabulary-population loop, same dictionary/synonym-map wiring) so
 * that baseline tests exercise the exact same code paths runSearch() sees
 * in production, just fed synthetic docs instead of `vault.getMarkdownFiles()`.
 *
 * If main.js's `_build()` loop changes (e.g. for the parallelization /
 * lazy-JSON-load optimizations), this harness's steps should be updated to
 * match - keeping it a deliberate, visible mirror (rather than importing
 * `_build` directly, which is a private method on a class that also wants
 * a real `app` instance) means any drift is a conscious decision, not an
 * accident.
 */
import { createIndex, insertDocs } from "../../schema.js";
import { tokenize, buildSynonymMap, buildDictionary } from "../../german.js";

/**
 * @param {Array} notes - fixture docs shaped like { rowId, notePath, code,
 *   titel, titleEn, section, tags, content } (content already "stripped",
 *   unlike production which runs stripForContent() on raw markdown first -
 *   these fixtures skip that step since they're plain text already).
 * @param {object} [opts]
 * @param {Array} [opts.glossaryTerms] - passed straight to buildSynonymMap.
 * @param {Array} [opts.openThesaurusPairs] - passed straight to buildSynonymMap.
 * @param {object} [opts.compoundParts] - precomputed decompound overrides.
 */
export async function buildTestEngine(notes, opts = {}) {
  const { glossaryTerms = [], openThesaurusPairs = [], compoundParts = {} } = opts;

  const synonymMap = buildSynonymMap(glossaryTerms, openThesaurusPairs);
  const vocabulary = new Set();
  const titleAndTagTokenLists = [];
  const contentByRowId = new Map();
  const docs = [];

  for (const note of notes) {
    const { rowId, notePath, code, titel, titleEn, section, content } = note;
    const tags = note.tags || [];

    docs.push({ rowId, notePath, code, titel, titleEn, section, tags, content });
    contentByRowId.set(rowId, content);

    titleAndTagTokenLists.push(tokenize(titel));
    titleAndTagTokenLists.push(tokenize(titleEn));
    titleAndTagTokenLists.push(tokenize(section));
    for (const tag of tags) titleAndTagTokenLists.push(tokenize(tag));

    for (const tok of tokenize(titel)) vocabulary.add(tok);
    for (const tok of tokenize(titleEn)) vocabulary.add(tok);
    for (const tag of tags) for (const tok of tokenize(tag)) vocabulary.add(tok);
    for (const tok of tokenize(content)) vocabulary.add(tok);
  }

  const dict = buildDictionary(titleAndTagTokenLists, synonymMap);

  const db = await createIndex();
  await insertDocs(db, docs);

  return { db, vocabulary, synonymMap, dict, compoundParts, contentByRowId };
}
