import { createIndex, insertDocs } from "../../schema.js";
import { tokenize, buildSynonymMap, buildDictionary } from "../../german.js";

/**
 * Replicates SearchEngine's index-construction steps over a fixed array of
 * in-memory fixture notes, without any Obsidian vault I/O.
 * @param {Array} notes
 * @param {object} [opts]
 * @param {Array} [opts.glossaryTerms]
 * @param {Array} [opts.openThesaurusPairs]
 * @param {object} [opts.compoundParts]
 * @returns {Promise<{db: object, vocabulary: Set<string>, synonymMap: Map, dict: Set<string>, compoundParts: object, contentByRowId: Map}>}
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

    for (const token of tokenize(titel)) vocabulary.add(token);
    for (const token of tokenize(titleEn)) vocabulary.add(token);
    for (const tag of tags) for (const token of tokenize(tag)) vocabulary.add(token);
    for (const token of tokenize(content)) vocabulary.add(token);
  }

  const dict = buildDictionary(titleAndTagTokenLists, synonymMap);

  const db = await createIndex();
  await insertDocs(db, docs);

  return { db, vocabulary, synonymMap, dict, compoundParts, contentByRowId };
}
