import { fold } from "../german/fold.js";

const SCAN_CHUNK_SIZE = 4000;
const MAX_SCAN_CHARS = 40000;
const SNIPPET_LEADING_CHARS = 40;
const SNIPPET_TRAILING_CHARS = 80;
const MIN_SNIPPET_TERM_LENGTH = 3;

/**
 * @param {string} content
 * @param {string[]} terms
 * @returns {number} index into the original (unfolded) content, or -1 if not found
 */
function findFirstMatchPosition(content, terms) {
  const scanLimit = Math.min(content.length, MAX_SCAN_CHARS);
  const longestTerm = terms.reduce((max, term) => Math.max(max, term.length), 0);
  const overlap = Math.max(0, longestTerm - 1);

  for (let chunkStart = 0; chunkStart < scanLimit; chunkStart += SCAN_CHUNK_SIZE) {
    const chunkEnd = Math.min(content.length, chunkStart + SCAN_CHUNK_SIZE + overlap);
    const foldedChunk = fold(content.slice(chunkStart, chunkEnd));

    let earliestInChunk = -1;
    for (const term of terms) {
      const position = foldedChunk.indexOf(term);
      if (position !== -1 && (earliestInChunk === -1 || position < earliestInChunk)) {
        earliestInChunk = position;
      }
    }
    if (earliestInChunk !== -1) return chunkStart + earliestInChunk;
    if (chunkEnd >= content.length) break;
  }

  return -1;
}

/**
 * @param {string} content
 * @param {number} matchPosition
 * @returns {string}
 */
function buildSnippetAround(content, matchPosition) {
  const start = Math.max(0, matchPosition - SNIPPET_LEADING_CHARS);
  const end = Math.min(content.length, matchPosition + SNIPPET_TRAILING_CHARS);

  let snippet = content.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snippet = `… ${snippet}`;
  if (end < content.length) snippet = `${snippet} …`;
  return snippet;
}

/**
 * Builds a short matched-text snippet around the earliest occurrence of
 * any expanded query term in a note's plain content. Scans in bounded
 * chunks (up to {@link MAX_SCAN_CHARS} into the note) rather than folding
 * the whole note on every search.
 * @param {string} content
 * @param {string[]} expandedTerms
 * @returns {string} the snippet, or "" if no term is found within the scan limit
 */
export function snippetFor(content, expandedTerms) {
  if (!content) return "";

  const terms = expandedTerms.filter((term) => term.length >= MIN_SNIPPET_TERM_LENGTH);
  if (terms.length === 0) return "";

  const matchPosition = findFirstMatchPosition(content, terms);
  if (matchPosition === -1) return "";

  return buildSnippetAround(content, matchPosition);
}
