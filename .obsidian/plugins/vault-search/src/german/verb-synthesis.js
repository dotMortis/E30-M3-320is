import { SPLIT_PREFIX_DENY } from "./decompound.js";
import { STOPWORDS } from "./stopwords.js";

const MIN_VERBISH_LENGTH = 3;
const MIN_STEM_LENGTH = 3;

/**
 * Guesses the bare stem of a conjugated German verb from its common
 * present-tense endings (e.g. "baue" -> "bau"), plus the word itself
 * unchanged.
 * @param {string} word
 * @returns {Set<string>}
 */
export function verbStemCandidates(word) {
  const stems = new Set([word]);
  for (const suffix of ["est", "st", "et", "en", "e", "t"]) {
    if (word.length - suffix.length >= MIN_STEM_LENGTH && word.endsWith(suffix)) {
      stems.add(word.slice(0, word.length - suffix.length));
    }
  }
  return stems;
}

/**
 * Bridges German separable-prefix verbs split apart in normal sentences
 * (e.g. "baue ... ein" -> "einbauen") by joining every (prefix, verbish
 * word) pair found in the query and keeping only candidates that exist in
 * `vocabulary`.
 * @param {string[]} queryTokens
 * @param {Set<string>} vocabulary
 * @returns {string[]}
 */
export function synthesizeSeparableVerbs(queryTokens, vocabulary) {
  const prefixes = queryTokens.filter((token) => SPLIT_PREFIX_DENY.has(token));
  if (prefixes.length === 0) return [];

  const verbishWords = queryTokens.filter(
    (token) => token.length >= MIN_VERBISH_LENGTH && !SPLIT_PREFIX_DENY.has(token) && !STOPWORDS.has(token)
  );

  const candidates = new Set();
  for (const prefix of prefixes) {
    for (const word of verbishWords) {
      for (const stem of verbStemCandidates(word)) {
        const candidate = `${prefix}${stem}en`;
        if (vocabulary.has(candidate)) candidates.add(candidate);
      }
    }
  }
  return [...candidates];
}
