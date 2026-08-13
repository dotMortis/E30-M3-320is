import { tokenize } from "../german/fold.js";

const MIN_CORRECTION_TOKEN_LENGTH = 4;

/**
 * Builds a lightweight typo-correction hint for the UI: if escalation
 * needed tolerance > 0 to find anything, reports the first query token
 * that isn't a literal vocabulary hit.
 * @param {string} rawQuery
 * @param {number} toleranceUsed
 * @param {Set<string>} vocabulary
 * @returns {{from: string, to: string}|null}
 */
export function correctionHint(rawQuery, toleranceUsed, vocabulary) {
  if (toleranceUsed === 0) return null;

  for (const token of tokenize(rawQuery)) {
    if (token.length >= MIN_CORRECTION_TOKEN_LENGTH && !vocabulary.has(token)) {
      return { from: token, to: `${token} (tippfehlertolerant gesucht)` };
    }
  }
  return null;
}
