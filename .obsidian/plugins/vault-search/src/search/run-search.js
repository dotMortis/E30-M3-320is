import { tokenize } from "../german/fold.js";
import { expandQuery, expandQueryConcepts } from "../german/query-expansion.js";
import { maxJustifiedTolerance, escalatingSearch } from "./tolerance.js";
import { rerankByCoverage } from "./concept-coverage.js";
import { correctionHint } from "./correction-hint.js";
import { snippetFor } from "./snippet.js";

const MIN_CONTENT_WORD_LENGTH = 3;

/**
 * @param {object} hit
 * @param {number} rank
 * @param {Map<string, string>} contentByRowId
 * @param {string[]} expandedTerms
 * @returns {object}
 */
function toResult(hit, rank, contentByRowId, expandedTerms) {
  const doc = hit.document;
  return {
    notePath: doc.notePath,
    seitencode: doc.code,
    sektion: doc.section,
    titel: doc.titel,
    rank,
    score: hit.score,
    snippet: snippetFor(contentByRowId.get(doc.rowId) || "", expandedTerms),
  };
}

/**
 * Runs a full search: expands the raw query into search terms, runs an
 * escalating-tolerance Orama search, re-ranks by concept coverage, and
 * shapes the result into the shape the UI (and external consumers such as
 * rag-chat's fuzzy search leg) expect.
 * @param {object} db
 * @param {string} rawQuery
 * @param {number} limit
 * @param {Set<string>} vocabulary
 * @param {Map<string, string>} contentByRowId
 * @param {Map<string, Set<string>>} synonymMap
 * @param {Set<string>} dict
 * @param {Record<string, string[]>} compoundParts
 * @param {() => boolean} [shouldAbort]
 * @returns {Promise<{results: object[], correction: {from: string, to: string}|null, expandedTerms: string[]}>}
 */
export async function runSearch(
  db,
  rawQuery,
  limit,
  vocabulary,
  contentByRowId,
  synonymMap,
  dict,
  compoundParts,
  shouldAbort = () => false
) {
  const query = (rawQuery || "").trim();
  if (!query) return { results: [], correction: null, expandedTerms: [] };

  const contentWords = tokenize(query).filter((word) => word.length >= MIN_CONTENT_WORD_LENGTH);
  const expandedTerms = expandQuery(query, synonymMap, dict, vocabulary, compoundParts);
  const term = expandedTerms.join(" ");
  const concepts = expandQueryConcepts(query, synonymMap, dict, vocabulary, compoundParts);

  const cap = maxJustifiedTolerance(contentWords);
  const { result, toleranceUsed } = await escalatingSearch(db, term, cap, shouldAbort);
  const rankedHits = rerankByCoverage(result.hits, concepts);

  const results = rankedHits.slice(0, limit).map((hit, rank) => toResult(hit, rank, contentByRowId, expandedTerms));

  return {
    results,
    correction: correctionHint(query, toleranceUsed, vocabulary),
    expandedTerms,
  };
}
