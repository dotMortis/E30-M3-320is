const FOLD_EXPAND = { ü: "ue", ö: "oe", ä: "ae", ß: "ss" };
const MIN_HIGHLIGHT_TERM_LENGTH = 2;

/**
 * Folds `text` the same way {@link import("./german/fold.js").fold} does,
 * while recording which original-text index each folded character came
 * from.
 * @param {string} text
 * @returns {{folded: string, map: number[]}}
 */
function foldWithOriginalIndexMap(text) {
  const input = text || "";
  let folded = "";
  const map = [];

  for (let i = 0; i < input.length; i++) {
    const lower = input[i].toLowerCase();
    const expanded = FOLD_EXPAND[lower] !== undefined ? FOLD_EXPAND[lower] : lower;
    const normalized = expanded.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    for (const char of normalized) {
      folded += char;
      map.push(i);
    }
  }

  return { folded, map };
}

/**
 * @param {Array<[number, number]>} ranges sorted by start index
 * @returns {Array<[number, number]>}
 */
function mergeOverlappingRanges(ranges) {
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const previous = merged[merged.length - 1];
    const current = ranges[i];
    if (current[0] <= previous[1]) {
      previous[1] = Math.max(previous[1], current[1]);
    } else {
      merged.push(current);
    }
  }
  return merged;
}

/**
 * Finds highlight ranges in `text` for a set of already-folded match
 * terms, mapping them back to character ranges in the original
 * (unfolded) text for Obsidian's `renderMatches()`. Terms shorter than
 * {@link MIN_HIGHLIGHT_TERM_LENGTH} are ignored.
 * @param {string} text
 * @param {string[]} terms
 * @returns {Array<[number, number]>}
 */
export function findTermRanges(text, terms) {
  if (!text || !terms || terms.length === 0) return [];

  const { folded, map } = foldWithOriginalIndexMap(text);
  if (!folded) return [];

  const ranges = [];
  for (const term of terms) {
    if (!term || term.length < MIN_HIGHLIGHT_TERM_LENGTH) continue;

    let from = 0;
    let position;
    while ((position = folded.indexOf(term, from)) !== -1) {
      const startOriginal = map[position];
      const endOriginal = map[position + term.length - 1] + 1;
      ranges.push([startOriginal, endOriginal]);
      from = position + term.length;
    }
  }

  if (ranges.length === 0) return [];
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return mergeOverlappingRanges(ranges);
}
