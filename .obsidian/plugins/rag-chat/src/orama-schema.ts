/**
 * orama-schema.ts — TypeScript port of .pipeline/rag/build/orama_schema.mjs.
 * MUST stay in sync with that file (schema + German tokenizer config); it is
 * the source of truth for how the shipped rag-index.orama.msp was built.
 *
 * CRITICAL correctness note (discovered during Phase 3/5 QA, see PLAN.md):
 * Orama's `restoreFromFile`/`restore` cannot preserve custom tokenizer
 * components (stemmer functions and stopword lists aren't serializable) -
 * internally they create a placeholder db with the DEFAULT (English, no
 * stopwords) tokenizer, then `load()` the index data into it. A bare
 * `restoreFromFile` silently reverts to default English tokenization, which
 * reintroduces a real bug: the German preposition "hinter" (behind) prefix-
 * matches every "Hinterachse" (rear axle) page, badly polluting BM25/hybrid
 * ranking. The fix (`loadIndex` below) is: restore via the library (to get
 * the data), re-export with `save()`, then `create()` a fresh db with the
 * correct German tokenizer and `load()` the exported data into THAT.
 */

import { create, load, save, type AnyOrama } from "@orama/orama";
import { restoreFromFile } from "@orama/plugin-data-persistence/server";
import { stemmer as germanStemmer, language as germanLanguage } from "@orama/stemmers/german";

export const SHIPPED_INDEX_DIMS = 768;

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

export const ORAMA_SCHEMA = {
  seitencode: "string",
  sektionNr: "string",
  sektion: "string",
  titel: "string",
  tags: "string[]",
  notePath: "string",
  bilddatei: "string",
  kind: "enum",
  text: "string",
  embedding: `vector[${SHIPPED_INDEX_DIMS}]`,
} as const;

export interface RagDocument {
  seitencode: string;
  sektionNr: string;
  sektion: string;
  titel: string;
  tags: string[];
  notePath: string;
  bilddatei: string;
  kind: "text" | "multimodal";
  text: string;
  embedding: number[] | null;
}

/** Correctly restores the shipped binary index with the German tokenizer intact. */
export async function loadIndex(indexPath: string): Promise<AnyOrama> {
  const placeholder = await restoreFromFile("binary", indexPath, "node");
  const exported = await save(placeholder);
  const db = await create({
    schema: ORAMA_SCHEMA,
    components: { tokenizer: GERMAN_TOKENIZER },
  });
  await load(db, exported);
  return db;
}
