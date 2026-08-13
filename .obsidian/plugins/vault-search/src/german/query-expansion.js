import { tokenize } from "./fold.js";
import { STOPWORDS } from "./stopwords.js";
import { decompoundCached, FUGEN, MIN_PART_LEN, SPLIT_PREFIX_DENY } from "./decompound.js";
import { synthesizeSeparableVerbs, verbStemCandidates } from "./verb-synthesis.js";
import { synthesizeJoinedCompounds } from "./compound-synthesis.js";
import { expandSynonyms } from "./synonyms.js";

/**
 * Full query-time expansion pipeline: a raw query string becomes a
 * deduplicated list of search terms (literal tokens, synonyms, decompound
 * parts, and synthesized separable-verb/joined-compound candidates) fed to
 * Orama as one search string.
 * @param {string} rawQuery
 * @param {Map<string, Set<string>>} synonymMap
 * @param {Set<string>} dict
 * @param {Set<string>} [vocabulary]
 * @param {Record<string, string[]>} [compoundParts]
 * @returns {string[]}
 */
export function expandQuery(rawQuery, synonymMap, dict, vocabulary, compoundParts) {
  const allTokens = tokenize(rawQuery);
  const content = allTokens.filter((token) => !STOPWORDS.has(token));
  const expanded = new Set(content);
  const vocab = vocabulary || new Set();
  const precomputedSplits = compoundParts || {};

  for (const token of content) {
    const synonyms = expandSynonyms(synonymMap, token);
    for (const synonym of synonyms) expanded.add(synonym);

    if (synonyms.length === 0) {
      const parts = precomputedSplits[token] || decompoundCached(token, dict);
      if (parts) for (const part of parts) expanded.add(part);
    }
  }

  for (const candidate of synthesizeSeparableVerbs(allTokens, vocab)) expanded.add(candidate);
  for (const candidate of synthesizeJoinedCompounds(content, vocab)) expanded.add(candidate);

  return [...expanded];
}

/**
 * @param {string[]} content
 * @param {Map<string, Set<string>>} synonymMap
 * @param {Set<string>} dict
 * @param {Record<string, string[]>} precomputedSplits
 * @returns {{concepts: Array<{raw: string, terms: Set<string>}>, conceptByRaw: Map<string, object>}}
 */
function buildConcepts(content, synonymMap, dict, precomputedSplits) {
  const concepts = [];
  const conceptByRaw = new Map();

  for (const token of content) {
    if (token.length < 3 || conceptByRaw.has(token)) continue;

    const terms = new Set([token]);
    const synonyms = expandSynonyms(synonymMap, token);
    for (const synonym of synonyms) terms.add(synonym);

    if (synonyms.length === 0) {
      const parts = precomputedSplits[token] || decompoundCached(token, dict);
      if (parts) for (const part of parts) terms.add(part);
    }

    const concept = { raw: token, terms };
    conceptByRaw.set(token, concept);
    concepts.push(concept);
  }

  return { concepts, conceptByRaw };
}

/**
 * Like {@link expandQuery}, but groups the expansion by originating query
 * "concept" (one meaningful content word plus everything that satisfies
 * it: itself, its synonyms, its decompound parts, and any synthesized
 * candidate built from it) instead of flattening it into one bag of terms.
 * Used by the ranking layer to reward matching several distinct query
 * concepts rather than repeating one.
 * @param {string} rawQuery
 * @param {Map<string, Set<string>>} synonymMap
 * @param {Set<string>} dict
 * @param {Set<string>} [vocabulary]
 * @param {Record<string, string[]>} [compoundParts]
 * @returns {Array<{raw: string, terms: string[]}>}
 */
export function expandQueryConcepts(rawQuery, synonymMap, dict, vocabulary, compoundParts) {
  const allTokens = tokenize(rawQuery);
  const content = allTokens.filter((token) => !STOPWORDS.has(token));
  const vocab = vocabulary || new Set();
  const precomputedSplits = compoundParts || {};

  const { concepts, conceptByRaw } = buildConcepts(content, synonymMap, dict, precomputedSplits);

  const prefixes = allTokens.filter((token) => SPLIT_PREFIX_DENY.has(token));
  for (const prefix of prefixes) {
    for (const concept of concepts) {
      for (const stem of verbStemCandidates(concept.raw)) {
        const candidate = `${prefix}${stem}en`;
        if (vocab.has(candidate)) concept.terms.add(candidate);
      }
    }
  }

  for (let i = 0; i < content.length - 1; i++) {
    const a = content[i];
    const b = content[i + 1];
    if (a.length < MIN_PART_LEN || b.length < MIN_PART_LEN) continue;

    const conceptA = conceptByRaw.get(a);
    const conceptB = conceptByRaw.get(b);
    if (!conceptA && !conceptB) continue;

    for (const fugen of FUGEN) {
      const candidate = a + fugen + b;
      if (!vocab.has(candidate)) continue;
      if (conceptA) conceptA.terms.add(candidate);
      if (conceptB) conceptB.terms.add(candidate);
    }
  }

  return concepts.map((concept) => ({ raw: concept.raw, terms: [...concept.terms] }));
}
