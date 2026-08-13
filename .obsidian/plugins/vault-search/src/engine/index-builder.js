import { tokenize } from "../german/fold.js";
import { stripForContent } from "../german/strip-content.js";
import { buildSynonymMap } from "../german/synonyms.js";
import { buildDictionary } from "../german/dictionary.js";
import { createIndex, insertDocs } from "../schema/orama-index.js";
import { mapWithConcurrency } from "./concurrency.js";
import { loadGlossaryTerms, loadPluginJsonFile } from "./data-loader.js";

const INDEX_BUILD_CONCURRENCY = 32;

/**
 * @param {*} tags
 * @returns {string[]}
 */
function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((tag) => tag.toString());
  if (typeof tags === "string") return tags.split(/[,\s]+/);
  return [];
}

/**
 * Extracts a single note's searchable fields from its frontmatter and content.
 * @param {import("obsidian").App} app
 * @param {import("obsidian").TFile} file
 * @returns {Promise<object>}
 */
async function readNoteDoc(app, file) {
  const cache = app.metadataCache.getFileCache(file) || {};
  const frontmatter = cache.frontmatter || {};

  let raw = "";
  try {
    raw = await app.vault.cachedRead(file);
  } catch (error) {
    raw = "";
  }

  return {
    rowId: file.path,
    notePath: file.path,
    code: (frontmatter.seitencode || "").toString(),
    titel: (frontmatter.titel || frontmatter.title || file.basename || "").toString(),
    titleEn: (frontmatter.titel_en || "").toString(),
    section: (frontmatter.sektion || "").toString(),
    tags: normalizeTags(frontmatter.tags),
    content: stripForContent(raw),
  };
}

/**
 * @param {object} doc
 * @param {Set<string>} vocabulary
 * @param {string[][]} titleAndTagTokenLists
 */
function collectVocabulary(doc, vocabulary, titleAndTagTokenLists) {
  titleAndTagTokenLists.push(tokenize(doc.titel));
  titleAndTagTokenLists.push(tokenize(doc.titleEn));
  titleAndTagTokenLists.push(tokenize(doc.section));
  for (const tag of doc.tags) titleAndTagTokenLists.push(tokenize(tag));

  for (const token of tokenize(doc.titel)) vocabulary.add(token);
  for (const token of tokenize(doc.titleEn)) vocabulary.add(token);
  for (const tag of doc.tags) for (const token of tokenize(tag)) vocabulary.add(token);
  for (const token of tokenize(doc.content)) vocabulary.add(token);
}

/**
 * Reads every markdown note in the vault and builds the search index plus
 * its supporting vocabulary/dictionary/synonym structures.
 * @param {import("obsidian").App} app
 * @param {string} pluginDir
 * @returns {Promise<{
 *   db: object,
 *   vocabulary: Set<string>,
 *   contentByRowId: Map<string, string>,
 *   synonymMap: Map<string, Set<string>>,
 *   dict: Set<string>,
 *   compoundParts: Record<string, string[]>,
 *   noteCount: number,
 * }>}
 */
export async function buildSearchIndex(app, pluginDir) {
  const [glossaryTerms, openThesaurusPairs, compoundParts] = await Promise.all([
    loadGlossaryTerms(app),
    loadPluginJsonFile(app, pluginDir, "data/synonyms.json", []),
    loadPluginJsonFile(app, pluginDir, "data/compound-parts.json", {}),
  ]);
  const synonymMap = buildSynonymMap(glossaryTerms, openThesaurusPairs);

  const mdFiles = app.vault.getMarkdownFiles();
  const docs = await mapWithConcurrency(mdFiles, INDEX_BUILD_CONCURRENCY, (file) => readNoteDoc(app, file));

  const vocabulary = new Set();
  const contentByRowId = new Map();
  const titleAndTagTokenLists = [];

  for (const doc of docs) {
    contentByRowId.set(doc.rowId, doc.content);
    collectVocabulary(doc, vocabulary, titleAndTagTokenLists);
  }

  const dict = buildDictionary(titleAndTagTokenLists, synonymMap);

  const db = await createIndex();
  await insertDocs(db, docs);

  return { db, vocabulary, contentByRowId, synonymMap, dict, compoundParts, noteCount: docs.length };
}
