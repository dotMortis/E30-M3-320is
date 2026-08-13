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
import { expandQuery, expandQueryConcepts, fold, tokenize } from "./german.js";

/** How much matching one additional DISTINCT query concept is worth,
 * relative to Orama's own BM25 score (see conceptCoverage() below and
 * german.js's expandQueryConcepts doc-comment for the full "why"). Matching
 * 2 concepts instead of 1 multiplies the score by (1 + this); matching 3
 * concepts by (1 + 2*this); etc. Chosen conservatively: big enough to fix
 * the observed case (a document repeating one rare word beating a document
 * that matches that rare word plus a common one) without letting coverage
 * override a genuinely dominant single-concept match (e.g. an exact page
 * code hit). Only ever applied when there's more than one concept to begin
 * with, so single-word queries are completely unaffected. */
const COVERAGE_BOOST_PER_EXTRA_CONCEPT = 0.35;

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
async function escalatingSearch(db, term, cap, shouldAbort) {
  let result = await runOnce(db, term, 0);
  let toleranceUsed = 0;
  for (let t = 1; t <= cap && result.hits.length < 5; t++) {
    // A newer query superseded this one (see runSearch's `shouldAbort` doc-
    // comment) - stop paying for further tolerance passes; whatever we
    // already have is about to be discarded by the caller anyway.
    if (shouldAbort()) break;
    const widened = await runOnce(db, term, t);
    if (widened.hits.length > result.hits.length) {
      result = widened;
      toleranceUsed = t;
    }
  }
  return { result, toleranceUsed };
}

// snippetFor() used to call fold() (4 .replace()s + toLowerCase() +
// Unicode NFD-normalize + another .replace()) on an ENTIRE note's content,
// for every one of up to 50 hits, on EVERY search - fine for a typical
// vault note (a few KB) but wasteful for this vault's largest outlier
// notes (tens of KB), especially now that search runs on every debounced
// keystroke. Instead, fold content in chunks and stop as soon as a match
// is found - for any note shorter than SNIPPET_SCAN_CHUNK_SIZE (the
// overwhelming majority) this is exactly one fold() pass over the whole
// content, identical in cost AND result to the old always-fold-everything
// behaviour; only outlier-length notes benefit AND only pay the reduced
// cost of scanning forward until a match turns up.
const SNIPPET_SCAN_CHUNK_SIZE = 4000;
// Hard cap: stop looking for a snippet match beyond this many characters
// into a note. Accepted trade-off (see optimization plan's #2): a note
// whose only matching term occurs deeper than this will show no snippet
// instead of one. In practice Orama already matched the doc via a
// title/tag/code/section field for it to be a hit at all, so a missing
// body snippet on a rare, very long, deep-match note is a minor cosmetic
// regression, not a lost search result.
const SNIPPET_MAX_SCAN_CHARS = 40000;

/** Builds a short matched-text snippet from a doc's plain content around the
 * earliest occurrence of any expanded query term. Returns "" if nothing hits. */
function snippetFor(content, expandedTerms) {
  if (!content) return "";
  const terms = expandedTerms.filter((t) => t.length >= 3);
  if (terms.length === 0) return "";

  const scanLimit = Math.min(content.length, SNIPPET_MAX_SCAN_CHARS);
  // Overlap consecutive chunks by (longest term length - 1) so a match
  // straddling a chunk boundary in the FOLDED text is never missed.
  const longestTerm = terms.reduce((m, t) => Math.max(m, t.length), 0);
  const overlap = Math.max(0, longestTerm - 1);

  let pos = -1;
  for (let chunkStart = 0; chunkStart < scanLimit; chunkStart += SNIPPET_SCAN_CHUNK_SIZE) {
    const chunkEnd = Math.min(content.length, chunkStart + SNIPPET_SCAN_CHUNK_SIZE + overlap);
    const foldedChunk = fold(content.slice(chunkStart, chunkEnd));
    let chunkPos = -1;
    for (const term of terms) {
      const p = foldedChunk.indexOf(term);
      if (p !== -1 && (chunkPos === -1 || p < chunkPos)) chunkPos = p;
    }
    if (chunkPos !== -1) {
      // Same original-vs-folded index approximation the pre-optimization
      // implementation already relied on (see module history) - exact
      // whenever no umlaut/ß expansion occurs before the match, which is
      // the common case; chunking doesn't change this pre-existing
      // behaviour, it only limits how much of the note gets folded.
      pos = chunkStart + chunkPos;
      break;
    }
    if (chunkEnd >= content.length) break;
  }
  if (pos === -1) return "";
  const start = Math.max(0, pos - 40);
  const end = Math.min(content.length, pos + 80);
  let snip = content.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snip = "… " + snip;
  if (end < content.length) snip = snip + " …";
  return snip;
}

/** Counts how many DISTINCT query concepts (see german.js's
 * expandQueryConcepts) a hit's document actually matches — as opposed to
 * how many individual (post-expansion) terms matched, which is what
 * Orama's own BM25 score already reflects. A concept counts as matched if
 * ANY of its terms (self, synonyms, decompound/synthesis candidates) shows
 * up in fields that describe what THIS specific page is about (title/
 * titleEn/tags/code) — deliberately excluding both the full body `content`
 * AND `section`/`notePath`. Verified against this vault: e.g. 13-710
 * ("...Kraftstoffdruck prüfen") mentions "einbauen" once, incidentally,
 * inside an unrelated tool-fitting step deep in its procedure body, and
 * its folder/notePath happens to be named "...aus- und einbauen..." after
 * a SIBLING page in the same section — either of those would make it
 * "match" the einbauen concept just as much as a page that's actually
 * ABOUT installing something, defeating the whole point of this bonus.
 * `section`/`notePath` describe the containing chapter/folder, not this
 * specific page, and `content` is procedure-body text where any verb can
 * incidentally show up once — none of them are reliable "is this page
 * ABOUT X" signals the way the page's own title/tags/code are. Plain
 * folded-substring search, same technique snippetFor() above already
 * uses — not a re-run of Orama's own (fuzzy/stemmed) matching, just a
 * cheap approximation good enough to rank coverage tiers. */
function conceptCoverage(doc, concepts) {
  const haystack = fold([doc.code, doc.titel, doc.titleEn, ...(doc.tags || [])].filter(Boolean).join(" "));
  let matched = 0;
  for (const concept of concepts) {
    if (concept.terms.some((t) => t.length >= 3 && haystack.includes(t))) matched++;
  }
  return matched;
}

/** Re-ranks Orama's hits by (BM25 score) * (coverage bonus), so a document
 * matching several distinct query concepts (e.g. both "kraftstoff" AND
 * "einbauen") is preferred over one that only matches a single concept —
 * even if that single concept happens to repeat, which is otherwise enough
 * to outscore a genuinely more relevant multi-concept match (see
 * german.js's expandQueryConcepts doc-comment for why). No-op whenever
 * there's 0 or 1 concept — Orama's own order is left completely untouched
 * for ordinary single-word (or fully stopword-filtered) queries. */
function rerankByCoverage(hits, concepts) {
  if (concepts.length <= 1) return hits;
  return hits
    .map((hit, index) => {
      const matched = conceptCoverage(hit.document, concepts);
      const bonus = 1 + COVERAGE_BOOST_PER_EXTRA_CONCEPT * Math.max(0, matched - 1);
      return { hit, index, combinedScore: hit.score * bonus };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore || a.index - b.index)
    .map(({ hit }) => hit);
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
 * avoid bloating search results with full page text). `shouldAbort` is an
 * optional zero-arg predicate the caller can pass to signal that a NEWER
 * query has already superseded this one (see VaultSearchModal's
 * `_queryToken` in main.js) - checked between escalation passes so a stale
 * in-flight search stops issuing further Orama calls instead of always
 * running the full tolerance-0/1/2 sequence to completion. Defaults to
 * "never abort", so callers like rag-chat's `api.search()` (which isn't
 * debounced/cancellable) are completely unaffected.
 *
 * Ranking note: Orama's hits already come back sorted by BM25 score, and
 * that alone can misrank multi-word queries in this vault — a generic verb
 * like "einbauen" appears in ~1/3 of ALL page titles (nearly every
 * procedure is "X aus- und einbauen"), so its IDF is tiny and matching it
 * barely moves the score, while a rarer word like "kraftstoff" is weighted
 * heavily enough that repeating IT twice can outscore a document that
 * matches it once plus "einbauen" once — even though the latter is the
 * more relevant page to a human reader. rerankByCoverage() (see above)
 * corrects for that with a small bonus for matching more DISTINCT query
 * concepts, applied on top of (not instead of) Orama's own score.
 */
export async function runSearch(
  db,
  rawQuery,
  limit,
  vocabulary,
  contentByRowId,
  synonymMap,
  dict,
  compoundParts,
  shouldAbort = () => false
) {
  const query = (rawQuery || "").trim();
  if (!query) return { results: [], correction: null, expandedTerms: [] };

  const contentWords = tokenize(query).filter((t) => t.length >= 3);
  const expanded = expandQuery(query, synonymMap, dict, vocabulary, compoundParts);
  const term = expanded.join(" ");
  const concepts = expandQueryConcepts(query, synonymMap, dict, vocabulary, compoundParts);

  const cap = maxJustifiedTolerance(contentWords);
  const { result, toleranceUsed } = await escalatingSearch(db, term, cap, shouldAbort);
  const rankedHits = rerankByCoverage(result.hits, concepts);

  const results = rankedHits.slice(0, limit).map((hit, i) => {
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
