/**
 * schema.js — Orama schema, German tokenizer, and field-boost weights for
 * vault-search's engine (see .pipeline/rag/PLAN.md's "Stage 2" notes).
 *
 * Scoped deliberately small: this is a fresh, in-memory-only, BM25-fulltext
 * index built at plugin load from the live vault (no vectors, no persisted
 * binary index files, no Node built-ins) — kept independent of rag-chat's
 * much larger committed vector index so this plugin stays lightweight and
 * works with isDesktopOnly: false (mobile-safe).
 */

import { create, insertMultiple } from "@orama/orama";
import { stemmer as germanStemmer, language as germanLanguage } from "@orama/stemmers/german";
import { STOPWORDS } from "./german.js";

/** Boost ratios mirror the v1 hand-rolled engine's field-tier weights
 * (W_CODE=60, W_TITLE=100, W_TAG=40, W_CONTENT=4) so ranking behaviour
 * carries over, applied via Orama's native per-property boost instead of a
 * hand-rolled scoring formula. `notePath` and `titleEn` are NEW searchable
 * fields (see module docstring / PLAN.md — "finds content and paths more
 * easily"). Confirmed via benchmarking: a flatter boost scheme was tried to
 * mitigate a specific known issue (see KNOWN_LIMITATIONS.md /
 * PLAN.md's Stage 2 notes — the "spannen"/"Spannung" stem-prefix collision)
 * but made overall benchmark results WORSE (3/10 vs 4/10), so these
 * v1-mirrored ratios are kept; that specific collision is a documented
 * residual limitation, not something boost-tuning can fix without
 * regressing other queries. */
export const FIELD_BOOST = {
  code: 15,
  titel: 10,
  titleEn: 6,
  tags: 4,
  notePath: 3,
  section: 2,
  content: 1,
};

export const SCHEMA = {
  rowId: "string",
  notePath: "string",
  code: "string",
  titel: "string",
  titleEn: "string",
  section: "string",
  tags: "string[]",
  content: "string",
};

/**
 * Custom Tokenizer (see the `Tokenizer` interface in @orama/orama's types) -
 * NOT just a DefaultTokenizerConfig. Orama's own built-in German splitter
 * (`SPLITTERS.german` in @orama/orama/.../languages.js) is
 * `/[^a-z0-9A-ZäöüÄÖÜß]+/gim` — it treats a hyphen as a separator. This
 * silently breaks two things this manual specifically needs:
 *   1. Page codes like "16-02" split into "16" and "02" (loses exact-code
 *      lookup - the whole point of indexing `code`/`notePath` at all).
 *   2. Any hyphenated synonym/term (e.g. a former colloquial entry "v-belt")
 *      splits into fragments, one of which can be a single letter that
 *      matches everywhere (confirmed live during Stage 2 benchmarking: "v"
 *      alone matched hundreds of pages via measurement labels like `„V"
 *      Einlassventil: 36,6mm`).
 * This tokenizer is otherwise identical to Orama's own default (stemming +
 * stopwords + per-(language,prop,token) caching) - only the split rule and
 * post-split hyphen trimming differ, matching german.js's own tokenize().
 */
const GERMAN_SPLIT_RULE = /[^a-z0-9A-ZäöüÄÖÜß-]+/gim;

function normalizeGermanToken(prop, token) {
  const key = `${germanLanguage}:${prop}:${token}`;
  if (this.normalizationCache.has(key)) return this.normalizationCache.get(key);
  if (this.stopWords.includes(token)) {
    this.normalizationCache.set(key, "");
    return "";
  }
  const stemmed = germanStemmer(token);
  this.normalizationCache.set(key, stemmed);
  return stemmed;
}

function tokenizeGerman(input) {
  if (typeof input !== "string") return [input];
  const rawTokens = input
    .toLowerCase()
    .split(GERMAN_SPLIT_RULE)
    // Trim leading/trailing hyphens a split can leave behind (e.g. a
    // standalone " - " in prose) - only INTERNAL hyphens (between
    // alphanumerics, as in note codes) should survive, matching
    // german.js's tokenize() regex intent.
    .map((t) => t.replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .map((t) => normalizeGermanToken.call(this, "", t))
    .filter(Boolean);
  return Array.from(new Set(rawTokens));
}

export function createGermanTokenizer() {
  const tokenizer = {
    language: germanLanguage,
    stopWords: [...STOPWORDS],
    normalizationCache: new Map(),
  };
  tokenizer.tokenize = tokenizeGerman.bind(tokenizer);
  return tokenizer;
}

export async function createIndex() {
  return create({ schema: SCHEMA, components: { tokenizer: createGermanTokenizer() } });
}

export async function insertDocs(db, docs) {
  await insertMultiple(db, docs);
}
