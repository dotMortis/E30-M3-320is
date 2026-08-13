import { fold, tokenize } from "./fold.js";
import { STOPWORDS } from "./stopwords.js";

const MIN_SYNONYM_TOKEN_LENGTH = 3;

/**
 * Hand-curated colloquial <-> manual-term bridges, expanded bidirectionally.
 * @type {string[][]}
 */
export const COLLOQUIAL_GROUPS = [
  ["benzin", "sprit", "treibstoff", "kraftstoff", "gasoline", "fuel"],
  ["auspuff", "abgasanlage", "schalldaempfer", "exhaust"],
  ["blinker", "fahrtrichtungsanzeiger", "richtungsanzeiger"],
  ["scheibenwischer", "wischer", "scheibenwischanlage"],
  ["kupplung", "clutch"],
  ["getriebe", "schaltgetriebe", "gearbox", "transmission"],
  ["stossdaempfer", "daempfer", "federbein", "shock"],
  ["zuendkerze", "kerze", "spark plug"],
  ["batterie", "akku", "battery"],
  ["kuehler", "kuehlung", "radiator", "cooling"],
  ["lichtmaschine", "generator", "alternator"],
  ["anlasser", "starter"],
  ["reifen", "raeder", "rad", "tire", "wheel"],
  ["bremse", "bremsen", "brake"],
  ["scheinwerfer", "licht", "beleuchtung", "lampe", "headlight", "light"],
  ["tuere", "tuer", "tueren", "door"],
  ["sitz", "sitze", "seat"],
  ["tank", "kraftstofftank", "kraftstoffbehaelter", "fuel tank"],
  ["keilriemen", "antriebsriemen", "riemen"],
];

/**
 * @param {Map<string, Set<string>>} synonyms
 * @param {string} a
 * @param {string} b
 */
function addPair(synonyms, a, b) {
  const foldedA = fold(a);
  const foldedB = fold(b);
  if (!foldedA || !foldedB || foldedA === foldedB) return;
  if (foldedA.length < MIN_SYNONYM_TOKEN_LENGTH || foldedB.length < MIN_SYNONYM_TOKEN_LENGTH) return;
  if (STOPWORDS.has(foldedA) || STOPWORDS.has(foldedB)) return;

  if (!synonyms.has(foldedA)) synonyms.set(foldedA, new Set());
  synonyms.get(foldedA).add(foldedB);
}

/**
 * @param {string} phrase
 * @returns {string|null} the phrase's single content token, or null if it
 *   tokenizes to zero or multiple words
 */
function singleTokenOf(phrase) {
  const tokens = tokenize(phrase).filter((token) => !STOPWORDS.has(token) && token.length >= MIN_SYNONYM_TOKEN_LENGTH);
  return tokens.length === 1 ? tokens[0] : null;
}

/**
 * @param {Map<string, Set<string>>} synonyms
 * @param {string} a
 * @param {string} b
 */
function linkColloquial(synonyms, a, b) {
  const tokenA = singleTokenOf(a);
  const tokenB = singleTokenOf(b);
  if (tokenA && tokenB) {
    addPair(synonyms, tokenA, tokenB);
    addPair(synonyms, tokenB, tokenA);
  }
}

/**
 * @param {Map<string, Set<string>>} synonyms
 * @param {string} a
 * @param {string} b
 */
function linkGlossary(synonyms, a, b) {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.length === 1 && tokensB.length === 1) {
    addPair(synonyms, tokensA[0], tokensB[0]);
    addPair(synonyms, tokensB[0], tokensA[0]);
  }
}

/**
 * Builds a bidirectional token -> Set(synonym tokens) map from
 * {@link COLLOQUIAL_GROUPS}, an optional glossary (`{de, en, variants}`
 * entries), and an optional list of already-folded single-word pairs
 * (e.g. from a filtered OpenThesaurus dump).
 * @param {Array<{de?: string, en?: string, variants?: string[]}>} glossaryTerms
 * @param {Array<[string, string]>} openThesaurusPairs
 * @returns {Map<string, Set<string>>}
 */
export function buildSynonymMap(glossaryTerms, openThesaurusPairs) {
  const synonyms = new Map();

  for (const group of COLLOQUIAL_GROUPS) {
    for (let i = 0; i < group.length; i++) {
      for (let j = 0; j < group.length; j++) {
        if (i !== j) linkColloquial(synonyms, group[i], group[j]);
      }
    }
  }

  for (const term of glossaryTerms || []) {
    const de = term.de || "";
    const en = term.en || "";
    const variants = Array.isArray(term.variants) ? term.variants : [];
    if (de && en) linkGlossary(synonyms, de, en);
    for (const variant of variants) {
      if (de) linkGlossary(synonyms, de, variant);
      if (en) linkGlossary(synonyms, en, variant);
    }
  }

  for (const [a, b] of openThesaurusPairs || []) {
    addPair(synonyms, a, b);
    addPair(synonyms, b, a);
  }

  return synonyms;
}

/**
 * @param {Map<string, Set<string>>} synonymMap
 * @param {string} token
 * @returns {string[]}
 */
export function expandSynonyms(synonymMap, token) {
  const set = synonymMap.get(token);
  return set ? [...set] : [];
}
