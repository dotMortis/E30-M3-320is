import { STOPWORDS } from "./stopwords.js";
import { MIN_PART_LEN } from "./decompound.js";

/**
 * Builds the trusted dictionary used by decompounding: title/tag tokens
 * across the corpus plus every synonym-map key, excluding stopwords and
 * short tokens. Deliberately excludes raw body content to avoid
 * OCR-garbage splits.
 * @param {string[][]} titleAndTagTokenLists
 * @param {Map<string, Set<string>>} synonymMap
 * @returns {Set<string>}
 */
export function buildDictionary(titleAndTagTokenLists, synonymMap) {
  const dict = new Set();

  const addToDict = (token) => {
    if (token.length < MIN_PART_LEN || STOPWORDS.has(token)) return;
    dict.add(token);
  };

  for (const tokens of titleAndTagTokenLists) {
    for (const token of tokens) addToDict(token);
  }
  for (const [word] of synonymMap) addToDict(word);

  return dict;
}
