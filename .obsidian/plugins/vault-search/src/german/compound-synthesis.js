import { FUGEN, MIN_PART_LEN } from "./decompound.js";

/**
 * The reverse direction of {@link import("./decompound.js").decompound}:
 * when a compound is typed as separate words ("kraftstoff tank"),
 * synthesizes the joined form ("kraftstofftank") by trying each German
 * linking element between adjacent pairs. Only candidates that exist in
 * `vocabulary` are returned.
 * @param {string[]} contentWordsInOrder
 * @param {Set<string>} vocabulary
 * @returns {string[]}
 */
export function synthesizeJoinedCompounds(contentWordsInOrder, vocabulary) {
  const candidates = new Set();

  for (let i = 0; i < contentWordsInOrder.length - 1; i++) {
    const a = contentWordsInOrder[i];
    const b = contentWordsInOrder[i + 1];
    if (a.length < MIN_PART_LEN || b.length < MIN_PART_LEN) continue;

    for (const fugen of FUGEN) {
      const candidate = a + fugen + b;
      if (vocabulary.has(candidate)) candidates.add(candidate);
    }
  }

  return [...candidates];
}
