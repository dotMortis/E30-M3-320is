/**
 * orama_schema.mjs — single source of truth for the Orama schemas + German
 * tokenizer config, shared by build_orama.mjs and orama_search.mjs (and
 * mirrored in the plugin's orama-schema.ts/retriever.ts — see PLAN.md
 * Phase 4 and the "federated index" addendum).
 *
 * ARCHITECTURE — split text/vector indices (replaces the original single
 * hybrid index): GitHub hard-blocks any pushed file over 100MB. A single
 * hybrid index (BM25 + full 3072-dim vectors together) measures ~165MB for
 * this corpus, and Matryoshka-truncating vectors to fit under 100MB in one
 * file is lossy. Instead we ship:
 *   - ONE text-only index (rag-index-text.orama.msp): full corpus, BM25
 *     fulltext only, no `embedding` field — keeps IDF stats correct (single
 *     corpus) and stays tiny (no float arrays).
 *   - N vector-only index shards (rag-index-vectors-{i}.orama.msp): full
 *     3072-dim fidelity (NO truncation), no `text` field, split by row
 *     count so each shard file stays safely under 100MB.
 * Every row carries a stable `rowId` (see buildRowId below) present in BOTH
 * the text index and every vector shard, used to merge hits back together
 * at query time (see retriever.ts's federatedHybridSearch, which
 * reimplements Orama's own hybrid merge formula by hand across the split -
 * this is safe because Orama's vector search returns raw, non-corpus-
 * relative cosine scores, so scores from separate shards are directly
 * comparable; only BM25/IDF and the hybrid min-max normalization are
 * corpus-relative, which is why those stay in a single unsharded index).
 *
 * CRITICAL correctness note (discovered during Phase 3/5 QA): Orama's
 * `restoreFromFile`/`restore` cannot preserve custom tokenizer components
 * (stemmer functions and stopword lists aren't serializable) — internally
 * they create a placeholder db with the DEFAULT (English, no stopwords)
 * tokenizer, then `load()` the index data into it. Restoring with just
 * `restoreFromFile` silently reverts to default English tokenization, which
 * reintroduces the "hinter" ⊂ "Hinterachse" prefix-match bug this file's
 * German tokenizer config exists to fix. This only matters for the TEXT
 * index (the only one with a fulltext-tokenized field); vector shards have
 * no fulltext field so a bare restoreFromFile is fine for them.
 *
 * The correct restore pattern for the text index (`loadTextIndex` below) is:
 *   1. `placeholder = await restoreFromFile(...)`      (gets the data)
 *   2. `exported = await save(placeholder)`            (re-export as plain data)
 *   3. `db = await create({ schema, components: { tokenizer } })`  (correct config)
 *   4. `await load(db, exported)`                       (hydrate into it)
 */

import { create, load, save } from "@orama/orama";
import { restoreFromFile } from "@orama/plugin-data-persistence/server";
import { stemmer as germanStemmer, language as germanLanguage } from "@orama/stemmers/german";

// Full-fidelity Gemini embedding dims (no Matryoshka truncation - see
// ARCHITECTURE note above for why this is now safe to ship at full size).
export const EMBEDDING_DIMS = 3072;

// See build_orama.mjs for the full rationale. Kept here too so both the
// build and search/QA paths use byte-for-byte the same tokenizer.
export const GERMAN_STOPWORDS = [
  "der", "die", "das", "des", "dem", "den", "ein", "eine", "einer", "eines", "einem", "einen",
  "und", "oder", "aber", "sowie", "sowohl", "weder", "noch",
  "hinter", "vor", "über", "unter", "zwischen", "neben", "an", "auf", "in", "im", "am", "zu",
  "zum", "zur", "für", "von", "vom", "mit", "bei", "aus", "nach", "durch", "gegen", "ohne", "bis",
  "seit", "während", "wegen", "trotz", "innerhalb", "außerhalb", "oberhalb", "unterhalb",
  "ist", "sind", "war", "waren", "wird", "werden", "wurde", "wurden", "hat", "haben", "hatte",
  "hatten", "kann", "können", "muss", "müssen", "soll", "sollen", "darf", "dürfen", "sich",
  "als", "wie", "so", "nicht", "kein", "keine", "auch", "nur", "noch", "schon", "dass", "daß",
  "diese", "dieser", "dieses", "diesem", "diesen", "jene", "jener", "jenes",
];

export const GERMAN_TOKENIZER = {
  stemming: true,
  stemmer: germanStemmer,
  language: germanLanguage,
  stopWords: GERMAN_STOPWORDS,
};

// Metadata fields present on EVERY row in BOTH the text index and every
// vector shard - needed so hits from either side carry full citation info
// and can be merged on `rowId` without a cross-index lookup.
const METADATA_FIELDS = {
  rowId: "string",
  seitencode: "string",
  sektionNr: "string",
  sektion: "string",
  titel: "string",
  tags: "string[]",
  notePath: "string",
  bilddatei: "string",
  kind: "enum",
};

/** BM25 fulltext index schema - no `embedding` field (kept out of the doc
 * store entirely, see build_orama.mjs's field-stripping before insert). */
export const TEXT_SCHEMA = {
  ...METADATA_FIELDS,
  text: "string",
};

/** Vector-only shard schema - no `text` field (kept out of the doc store
 * entirely; full parent-note text is read live from the vault anyway). */
export const VECTOR_SCHEMA = {
  ...METADATA_FIELDS,
  embedding: `vector[${EMBEDDING_DIMS}]`,
};

/** Stable identity key shared by a row's text-index doc and vector-shard doc,
 * used to merge federated hybrid search hits (see retriever.ts). Derived
 * from fields chunk.py already emits - no chunker changes needed. */
export function buildRowId(row) {
  return `${row.notePath}::${row.kind}::${row.chunkIndex ?? "mm"}`;
}

/** Correctly restores the text index with the German tokenizer intact. */
export async function loadTextIndex(indexPath) {
  const placeholder = await restoreFromFile("binary", indexPath, "node");
  const exported = await save(placeholder);
  const db = await create({
    schema: TEXT_SCHEMA,
    components: { tokenizer: GERMAN_TOKENIZER },
  });
  await load(db, exported);
  return db;
}

/** Restores a vector-only shard. No custom tokenizer needed - there is no
 * fulltext field in this schema, so a bare restoreFromFile is safe here. */
export async function loadVectorShard(indexPath) {
  return await restoreFromFile("binary", indexPath, "node");
}
