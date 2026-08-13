import { search as oramaSearch } from "@orama/orama";
import { FIELD_BOOST } from "../schema/field-boost.js";

const SEARCHABLE_PROPERTIES = ["code", "titel", "titleEn", "tags", "notePath", "section", "content"];
const HITS_PER_PASS = 50;
const MIN_HITS_BEFORE_ESCALATING = 5;

/**
 * The maximum Levenshtein distance worth trying for a given query, scaled
 * by the longest content word (short words never get fuzzy-matched).
 * @param {string[]} contentWords
 * @returns {number}
 */
export function maxJustifiedTolerance(contentWords) {
  const longest = contentWords.reduce((max, word) => Math.max(max, word.length), 0);
  if (longest <= 3) return 0;
  if (longest <= 6) return 1;
  return 2;
}

/**
 * @param {object} db
 * @param {string} term
 * @param {number} tolerance
 * @returns {Promise<object>}
 */
async function runOnce(db, term, tolerance) {
  return oramaSearch(db, {
    term,
    tolerance,
    boost: FIELD_BOOST,
    properties: SEARCHABLE_PROPERTIES,
    limit: HITS_PER_PASS,
  });
}

/**
 * Searches at tolerance 0 first, then escalates tolerance one step at a
 * time (up to `cap`) only while results stay thin, stopping early once
 * `shouldAbort()` reports that a newer query has superseded this one.
 * @param {object} db
 * @param {string} term
 * @param {number} cap
 * @param {() => boolean} shouldAbort
 * @returns {Promise<{result: object, toleranceUsed: number}>}
 */
export async function escalatingSearch(db, term, cap, shouldAbort) {
  let result = await runOnce(db, term, 0);
  let toleranceUsed = 0;

  for (let tolerance = 1; tolerance <= cap && result.hits.length < MIN_HITS_BEFORE_ESCALATING; tolerance++) {
    if (shouldAbort()) break;
    const widened = await runOnce(db, term, tolerance);
    if (widened.hits.length > result.hits.length) {
      result = widened;
      toleranceUsed = tolerance;
    }
  }

  return { result, toleranceUsed };
}
