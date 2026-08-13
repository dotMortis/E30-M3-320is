/**
 * orama-schema.ts — TypeScript port of .pipeline/rag/build/orama_schema.mjs.
 * MUST stay in sync with that file (schemas + German tokenizer config); it
 * is the source of truth for how the shipped indices were built.
 *
 * ARCHITECTURE — split text/vector indices: GitHub hard-blocks any pushed
 * file over 100MB. A single hybrid index (BM25 + full 3072-dim vectors
 * together) measures ~165MB for this corpus, and Matryoshka-truncating
 * vectors to fit under 100MB in one file is lossy. Instead the shipped
 * index is split into:
 *   - ONE text-only index (rag-index-text.orama.msp): full corpus, BM25
 *     fulltext only, no `embedding` field.
 *   - N vector-only shards (rag-index-vectors-{i}.orama.msp, N from
 *     rag-manifest.json's vectorShardCount): full 3072-dim fidelity, no
 *     `text` field, split by row count to stay under 100MB per file.
 * Every row carries a `rowId` present in BOTH the text index and every
 * vector shard, used by retriever.ts's federatedHybridSearch to merge hits
 * back together (reimplementing Orama's own hybrid merge formula by hand -
 * safe because vector search returns raw, non-corpus-relative cosine
 * scores, so scores from separate shards are directly comparable; BM25/IDF
 * stays correct because the text index is never sharded).
 *
 * CRITICAL correctness note (discovered during Phase 3/5 QA, see PLAN.md):
 * Orama's `restoreFromFile`/`restore` cannot preserve custom tokenizer
 * components (stemmer functions and stopword lists aren't serializable) -
 * internally they create a placeholder db with the DEFAULT (English, no
 * stopwords) tokenizer, then `load()` the index data into it. A bare
 * `restoreFromFile` silently reverts to default English tokenization, which
 * reintroduces a real bug: the German preposition "hinter" (behind) prefix-
 * matches every "Hinterachse" (rear axle) page, badly polluting BM25
 * ranking. The fix (`loadTextIndex` below) is: restore via the library (to
 * get the data), re-export with `save()`, then `create()` a fresh db with
 * the correct German tokenizer and `load()` the exported data into THAT.
 * This only matters for the TEXT index (the only one with a fulltext-
 * tokenized field); vector shards have no fulltext field, so a bare
 * restoreFromFile is fine for them (`loadVectorShard`).
 */

import { create, load, save, type AnyOrama } from "@orama/orama";
import { restoreFromFile } from "@orama/plugin-data-persistence/server";
import { stemmer as germanStemmer, language as germanLanguage } from "@orama/stemmers/german";

/** Full-fidelity Gemini embedding dims (no Matryoshka truncation - see the
 * ARCHITECTURE note above for why this is safe to ship at full size). */
export const EMBEDDING_DIMS = 3072;

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

/** Metadata present on EVERY row in BOTH the text index and every vector
 * shard - so a hit from either side carries full citation info and can be
 * merged on `rowId` without a cross-index lookup. */
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
} as const;

export const TEXT_SCHEMA = {
  ...METADATA_FIELDS,
  text: "string",
} as const;

export const VECTOR_SCHEMA = {
  ...METADATA_FIELDS,
  embedding: `vector[${EMBEDDING_DIMS}]`,
} as const;

export interface RagMetadata {
  rowId: string;
  seitencode: string;
  sektionNr: string;
  sektion: string;
  titel: string;
  tags: string[];
  notePath: string;
  bilddatei: string;
  /** "text"/"multimodal" = page-note chunk/scan-vector (seitencode set,
   * full-file "Parent Note" expansion via vault.read). "reference" =
   * standalone reference-doc chunk (Sonderwerkzeuge.md, Glossar, ... -
   * empty seitencode, `sektion: "Referenz"`; context comes from the
   * reference-chunks.json sidecar, never a full-file read - see
   * retriever.ts's expandToParentNotes). */
  kind: "text" | "multimodal" | "reference";
}

export interface RagTextDocument extends RagMetadata {
  text: string;
}

export interface RagVectorDocument extends RagMetadata {
  embedding: number[] | null;
}

/** Correctly restores the text index with the German tokenizer intact. */
export async function loadTextIndex(indexPath: string): Promise<AnyOrama> {
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
export async function loadVectorShard(indexPath: string): Promise<AnyOrama> {
  return (await restoreFromFile("binary", indexPath, "node")) as AnyOrama;
}
