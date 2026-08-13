/**
 * orama_schema.mjs — single source of truth for the Orama schema + German
 * tokenizer config, shared by build_orama.mjs and orama_search.mjs (and
 * mirrored in the plugin's retriever.ts — see PLAN.md Phase 4).
 *
 * CRITICAL correctness note (discovered during Phase 3/5 QA): Orama's
 * `restoreFromFile`/`restore` cannot preserve custom tokenizer components
 * (stemmer functions and stopword lists aren't serializable) — internally
 * they create a placeholder db with the DEFAULT (English, no stopwords)
 * tokenizer, then `load()` the index data into it. Restoring with just
 * `restoreFromFile` silently reverts to default English tokenization, which
 * reintroduces the "hinter" ⊂ "Hinterachse" prefix-match bug this file's
 * German tokenizer config exists to fix.
 *
 * The correct restore pattern (implemented in `loadIndex` below) is:
 *   1. `placeholder = await restoreFromFile(...)`      (gets the data)
 *   2. `exported = await save(placeholder)`            (re-export as plain data)
 *   3. `db = await create({ schema, components: { tokenizer } })`  (correct config)
 *   4. `await load(db, exported)`                       (hydrate into it)
 * Any code that opens the shipped `rag-index.orama.msp` — including the
 * plugin — MUST use this pattern, not a bare `restoreFromFile`.
 */

import { create, load, save } from "@orama/orama";
import { restoreFromFile } from "@orama/plugin-data-persistence/server";
import { stemmer as germanStemmer, language as germanLanguage } from "@orama/stemmers/german";

export const SHIPPED_INDEX_DIMS = 768;

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
};

/** Correctly restores the shipped binary index with the German tokenizer intact. */
export async function loadIndex(indexPath) {
  const placeholder = await restoreFromFile("binary", indexPath, "node");
  const exported = await save(placeholder);
  const db = await create({
    schema: ORAMA_SCHEMA,
    components: { tokenizer: GERMAN_TOKENIZER },
  });
  await load(db, exported);
  return db;
}
