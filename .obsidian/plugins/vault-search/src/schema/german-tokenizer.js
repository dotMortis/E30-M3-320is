import { stemmer as germanStemmer, language as germanLanguage } from "@orama/stemmers/german";
import { STOPWORDS } from "../german/stopwords.js";

const SPLIT_RULE = /[^a-z0-9A-ZäöüÄÖÜß-]+/gim;

/**
 * @this {{stopWords: string[], normalizationCache: Map<string, string>}}
 * @param {string} prop
 * @param {string} token
 * @returns {string}
 */
function normalizeToken(prop, token) {
  const cacheKey = `${germanLanguage}:${prop}:${token}`;
  if (this.normalizationCache.has(cacheKey)) return this.normalizationCache.get(cacheKey);

  if (this.stopWords.includes(token)) {
    this.normalizationCache.set(cacheKey, "");
    return "";
  }

  const stemmed = germanStemmer(token);
  this.normalizationCache.set(cacheKey, stemmed);
  return stemmed;
}

/**
 * @this {{stopWords: string[], normalizationCache: Map<string, string>}}
 * @param {*} input
 * @returns {string[]}
 */
function tokenizeGerman(input) {
  if (typeof input !== "string") return [input];

  const tokens = input
    .toLowerCase()
    .split(SPLIT_RULE)
    .map((token) => token.replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .map((token) => normalizeToken.call(this, "", token))
    .filter(Boolean);

  return Array.from(new Set(tokens));
}

/**
 * Builds Orama's custom German tokenizer. Preserves internal hyphens (so
 * note codes like "16-02" and hyphenated terms survive as single tokens)
 * and applies the same stemming/stopword rules as the query-side
 * tokenizer in {@link import("../german/fold.js")}.
 * @returns {object}
 */
export function createGermanTokenizer() {
  const tokenizer = {
    language: germanLanguage,
    stopWords: [...STOPWORDS],
    normalizationCache: new Map(),
  };
  tokenizer.tokenize = tokenizeGerman.bind(tokenizer);
  return tokenizer;
}
