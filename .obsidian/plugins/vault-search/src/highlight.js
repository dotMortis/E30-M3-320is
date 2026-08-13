/**
 * highlight.js — maps a set of already-resolved (folded) match terms back to
 * character ranges in ORIGINAL (unfolded) text, for renderMatches(). Ported
 * verbatim from v1 (this part needed no changes for Stage 2).
 */

const FOLD_EXPAND = { ü: "ue", ö: "oe", ä: "ae", ß: "ss" };

function foldWithMap(s) {
  s = s || "";
  let folded = "";
  const map = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const lower = ch.toLowerCase();
    const expanded = FOLD_EXPAND[lower] !== undefined ? FOLD_EXPAND[lower] : lower;
    const norm = expanded.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (let k = 0; k < norm.length; k++) {
      folded += norm[k];
      map.push(i);
    }
  }
  return { folded, map };
}

/** Find highlight ranges in `text` for a set of already-resolved (folded)
 * match terms. Only terms of length >= 2 are considered (single chars would
 * bold almost everything). Returns a SearchMatches-compatible array. */
export function findTermRanges(text, terms) {
  if (!text || !terms || terms.length === 0) return [];
  const { folded, map } = foldWithMap(text);
  if (!folded) return [];
  const ranges = [];
  for (const term of terms) {
    if (!term || term.length < 2) continue;
    let from = 0;
    let pos;
    while ((pos = folded.indexOf(term, from)) !== -1) {
      const startOrig = map[pos];
      const lastFolded = pos + term.length - 1;
      const endOrig = map[lastFolded] + 1;
      ranges.push([startOrig, endOrig]);
      from = pos + term.length;
    }
  }
  if (ranges.length === 0) return [];
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const prev = merged[merged.length - 1];
    const cur = ranges[i];
    if (cur[0] <= prev[1]) {
      if (cur[1] > prev[1]) prev[1] = cur[1];
    } else {
      merged.push(cur);
    }
  }
  return merged;
}
