import { create, insertMultiple } from "@orama/orama";
import { SCHEMA } from "./field-boost.js";
import { createGermanTokenizer } from "./german-tokenizer.js";

/**
 * Creates a fresh, in-memory Orama index using the vault-search schema
 * and German tokenizer.
 * @returns {Promise<object>}
 */
export async function createIndex() {
  return create({ schema: SCHEMA, components: { tokenizer: createGermanTokenizer() } });
}

/**
 * @param {object} db
 * @param {object[]} docs
 * @returns {Promise<void>}
 */
export async function insertDocs(db, docs) {
  await insertMultiple(db, docs);
}
