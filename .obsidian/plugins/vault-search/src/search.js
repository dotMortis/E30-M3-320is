/**
 * search.js — query-time search driver for vault-search's Orama-backed
 * engine. Wraps: query expansion (german.js) -> escalating-tolerance Orama
 * search -> result shaping (snippet + typo-correction hint), producing the
 * same `{ results, correction }` shape the modal UI and rag-chat's fuzzy
 * leg (see .obsidian/plugins/rag-chat/src/retriever.ts's FuzzySearchApi)
 * already expect — so neither the UI nor rag-chat's integration needed to
 * change for this Stage 2 rewrite.
 */

import { search as oramaSearch } from "@orama/orama";
import { FIELD_BOOST } from "./schema.js";
import { expandQuery, fold, tokenize } from "./german.js";

/** Max Levenshtein distance to ever allow, scaled by the longest real
 * content word in the query — mirrors the v1 engine's length-gated typo
 * budget (short words never get fuzzy-matched; only long-enough words
 * justify tolerance 2). Used to cap how far the escalation loop below is
 * allowed to go, not applied per-word (Orama's `tolerance` is a single
 * flat number for the whole search — see module docstring in schema.js). */
function maxJustifiedTolerance(contentWords) {
  const longest = contentWords.reduce((m, w) => Math.max(m, w.length), 0);
  if (longest <= 3) return 0;
  if (longest <= 6) return 1;
  return 2;
}

/**
 * Runs one Orama search at a given tolerance over all boosted fields.
 */
async function runOnce(db, term, tolerance) {
  return oramaSearch(db, {
    term,
    tolerance,
    boost: FIELD_BOOST,
    properties: ["code", "titel", "titleEn", "tags", "notePath", "section", "content"],
    limit: 50,
  });
}

/**
 * Escalating-tolerance search: try exact/stemmed matching first (tolerance
 * 0), and only pay for fuzzy (typo-tolerant) matching if that comes back
 * thin — cheap on a corpus this size, and avoids flat-tolerance noise on
 * queries that didn't need it.
 */
async function escalatingSearch(db, term, cap) {
  let result = await runOnce(db, term, 0);
  let toleranceUsed = 0;
  for (let t = 1; t <= cap && result.hits.length < 5; t++) {
    const widened = await runOnce(db, term, t);
    if (widened.hits.length > result.hits.length) {
      result = widened;
      toleranceUsed = t;
    }
  }
  return { result, toleranceUsed };
}

/** Builds a short matched-text snippet from a doc's plain content around the
 * earliest occurrence of any expanded query term. Returns "" if nothing hits. */
function snippetFor(content, expandedTerms) {
  if (!content) return "";
  const folded = fold(content);
  let pos = -1;
  for (const term of expandedTerms) {
    if (term.length < 3) continue;
    const p = folded.indexOf(term);
    if (p !== -1 && (pos === -1 || p < pos)) pos = p;
  }
  if (pos === -1) return "";
  const start = Math.max(0, pos - 40);
  const end = Math.min(content.length, pos + 80);
  let snip = content.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snip = "… " + snip;
  if (end < content.length) snip = snip + " …";
  return snip;
}

/** Cheap post-hoc typo-correction hint for the UI ("meintest du...?"): if
 * escalation needed tolerance > 0 to find anything, look at which raw query
 * tokens aren't literal vocabulary hits and report the first one alongside
 * the query's own expanded form as the "correction". This is a UI nicety
 * only (does not affect ranking, which already happened via Orama's own
 * fuzzy matching) — kept intentionally simple. */
function correctionHint(rawQuery, toleranceUsed, vocabulary) {
  if (toleranceUsed === 0) return null;
  const tokens = tokenize(rawQuery);
  for (const tok of tokens) {
    if (tok.length >= 4 && !vocabulary.has(tok)) {
      return { from: tok, to: `${tok} (tippfehlertolerant gesucht)` };
    }
  }
  return null;
}

/**
 * Main entry point. `db` is the built Orama index (see schema.js).
 * `vocabulary` is a Set of folded literal tokens across titles/tags (for
 * the correction hint only). `notePathAndContent` maps rowId -> {notePath,
 * content} for snippet building (kept out of the Orama doc payload to
 * avoid bloating search results with full page text).
 */
export async function runSearch(db, rawQuery, limit, vocabulary, contentByRowId, synonymMap, dict, compoundParts) {
  const query = (rawQuery || "").trim();
  if (!query) return { results: [], correction: null, expandedTerms: [] };

  const contentWords = tokenize(query).filter((t) => t.length >= 3);
  const expanded = expandQuery(query, synonymMap, dict, vocabulary, compoundParts);
  const term = expanded.join(" ");

  const cap = maxJustifiedTolerance(contentWords);
  const { result, toleranceUsed } = await escalatingSearch(db, term, cap);

  const results = result.hits.slice(0, limit).map((hit, i) => {
    const doc = hit.document;
    return {
      notePath: doc.notePath,
      seitencode: doc.code,
      sektion: doc.section,
      titel: doc.titel,
      rank: i,
      score: hit.score,
      snippet: snippetFor(contentByRowId.get(doc.rowId) || "", expanded),
    };
  });

  return {
    results,
    correction: correctionHint(query, toleranceUsed, vocabulary),
    expandedTerms: expanded,
  };
}
