/** Separable-verb / generic prefixes that must never be the left-most part of a split. */
export const SPLIT_PREFIX_DENY = new Set([
  "aus", "ein", "um", "an", "ab", "auf", "vor", "nach", "zu", "bei", "mit",
  "durch", "ueber", "unter", "be", "ver", "ent", "er", "ge", "zer", "wieder",
]);

/** German linking elements (Fugenelemente), tried longest-first. */
export const FUGEN = ["ens", "ns", "es", "en", "s", "n", ""];

/** Minimum length for any single split part. */
export const MIN_PART_LEN = 4;

/** Minimum token length before a split is even attempted. */
export const MIN_TOKEN_TO_SPLIT = 8;

/** Maximum number of parts a single split may produce. */
export const MAX_PARTS = 3;

/**
 * @param {string} word
 * @param {Set<string>} dict
 * @returns {string|null} `word` itself, a de-inflected form of it that is
 *   in `dict`, or null if neither is known
 */
function dictBase(word, dict) {
  if (dict.has(word)) return word;
  for (const suffix of ["en", "e", "n", "s"]) {
    if (word.length - suffix.length >= MIN_PART_LEN && word.endsWith(suffix)) {
      const stem = word.slice(0, word.length - suffix.length);
      if (dict.has(stem)) return stem;
    }
  }
  return null;
}

/**
 * @param {string} left
 * @param {string} rest
 * @param {Set<string>} dict
 * @param {number} depth
 * @returns {string[]|null}
 */
function resolveRest(left, rest, dict, depth) {
  const restBase = dictBase(rest, dict);
  if (restBase) return [left, restBase];
  if (depth <= 1) return null;
  const sub = decompound(rest, dict, depth - 1);
  return sub ? [left, ...sub] : null;
}

/**
 * Recursively splits a folded compound token into known dictionary words,
 * allowing German linking elements between parts.
 * @param {string} token
 * @param {Set<string>} dict
 * @param {number} [depth]
 * @returns {string[]|null} the split parts (each in dictionary base form), or null
 */
export function decompound(token, dict, depth = MAX_PARTS - 1) {
  if (token.length < MIN_TOKEN_TO_SPLIT || depth <= 0) return null;

  let best = null;

  for (let i = MIN_PART_LEN; i <= token.length - MIN_PART_LEN; i++) {
    const left = token.slice(0, i);
    if (!dict.has(left) || SPLIT_PREFIX_DENY.has(left)) continue;

    for (const fugen of FUGEN) {
      if (token.slice(i, i + fugen.length) !== fugen) continue;
      const rest = token.slice(i + fugen.length);
      if (rest.length < MIN_PART_LEN) continue;

      const parts = resolveRest(left, rest, dict, depth);
      if (!parts || parts.length > MAX_PARTS) continue;

      const minPartLength = Math.min(...parts.map((part) => part.length));
      const isBetter =
        !best || parts.length < best.parts.length || (parts.length === best.parts.length && minPartLength > best.minPartLength);
      if (isBetter) best = { parts, minPartLength };
    }
  }

  return best ? best.parts : null;
}

const decompoundCacheByDict = new WeakMap();

/**
 * Cached wrapper around {@link decompound} for the default-depth case.
 * Cached per `dict` instance via WeakMap, so rebuilding the dictionary
 * can never serve a stale split.
 * @param {string} token
 * @param {Set<string>} dict
 * @returns {string[]|null}
 */
export function decompoundCached(token, dict) {
  let cache = decompoundCacheByDict.get(dict);
  if (!cache) {
    cache = new Map();
    decompoundCacheByDict.set(dict, cache);
  }
  if (cache.has(token)) return cache.get(token);

  const result = decompound(token, dict);
  cache.set(token, result);
  return result;
}
