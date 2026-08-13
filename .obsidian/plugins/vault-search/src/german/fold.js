import { STOPWORDS } from "./stopwords.js";

const TOKEN_PATTERN = /[a-z0-9]+(?:-[a-z0-9]+)*/g;
const MIN_CONTENT_TOKEN_LENGTH = 3;

/**
 * Normalizes text for matching: lowercases, expands umlauts/ß to ASCII
 * digraphs, then strips any remaining diacritics.
 * @param {string} text
 * @returns {string}
 */
export function fold(text) {
  return (text || "")
    .toLowerCase()
    .replace(/ü/g, "ue")
    .replace(/ö/g, "oe")
    .replace(/ä/g, "ae")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Splits text into folded, searchable tokens. Hyphenated note codes like
 * "16-02" are kept together; everything else splits on non-alphanumerics.
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  if (!text) return [];
  return fold(text).match(TOKEN_PATTERN) || [];
}

/**
 * `tokenize()` restricted to meaningful content words: stopwords and
 * tokens shorter than {@link MIN_CONTENT_TOKEN_LENGTH} are dropped.
 * @param {string} text
 * @returns {string[]}
 */
export function contentTokens(text) {
  return tokenize(text).filter((token) => token.length >= MIN_CONTENT_TOKEN_LENGTH && !STOPWORDS.has(token));
}
