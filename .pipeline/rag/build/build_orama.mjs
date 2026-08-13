#!/usr/bin/env node
/**
 * build_orama.mjs — Phase 3 of the RAG indexer (see .pipeline/rag/PLAN.md).
 *
 * Reads ./chunks.json (produced by embed_gemini.py) and builds a committed
 * Orama hybrid-search index (BM25 + vector) plus a small manifest, written
 * into the shipped plugin directory:
 *   .obsidian/plugins/rag-chat/rag-index.orama.msp
 *   .obsidian/plugins/rag-chat/rag-manifest.json
 *
 * Schema + German tokenizer config live in orama_schema.mjs (shared with
 * orama_search.mjs and, eventually, the plugin's retriever.ts) — see that
 * file for the CRITICAL restore-pattern note (custom tokenizers do not
 * survive a bare `restoreFromFile`; must re-`create`+`load`).
 *
 * API notes (verified live against @orama/orama 3.1.18 + plugin-data-
 * persistence 3.1.18, Aug 2026 — the plan's assumptions checked out):
 *   - create/insertMultiple/search are all async (`await`) in Orama v3.
 *   - `save`/`load` ARE still exported from @orama/orama core in this
 *     version (contrary to some outdated blog posts claiming they were
 *     removed in v3).
 *   - File-based persistence lives in `@orama/plugin-data-persistence/server`
 *     as `persistToFile`/`restoreFromFile` (the base, non-/server import
 *     intentionally throws a "moved" error for these two functions).
 *   - Fields not declared in the schema still ride along on each document
 *     (e.g. `chunkIndex`, `imagePath`) — Orama just doesn't index them for
 *     search, which is fine since retrieval only needs `notePath` (to dedupe
 *     and re-read the full parent note) and the citation fields.
 *   - `enum` schema fields need `where: { field: { eq: value } } }` filter
 *     syntax, not a bare value.
 *   - Binary persistence has a ~512MB practical ceiling (Node string-length
 *     limits in the hex-encoding step) — irrelevant here after the dims cut
 *     below, but noted for future corpus growth.
 *
 * CRITICAL — dimensionality reduction (discovered during this phase, see
 * PLAN.md "Shipped index dims"): this repo's remote is GitHub, which hard-
 * blocks any pushed file over 100MB. The full-fidelity 3072-dim binary index
 * measured 164.7MB (too big). `gemini-embedding-2` is trained with Matryoshka
 * Representation Learning, so each cached 3072-dim vector is truncated to
 * its first SHIPPED_INDEX_DIMS floats and L2-renormalized here — no
 * re-embedding, no extra API cost. Measured on the real corpus at 768 dims:
 * 53.1MB (safe margin under 100MB; 768 is one of Google's three explicitly
 * "recommended" dims with "little quality loss"). The cache (chunks.json,
 * embeddings-cache/) stays at full 3072-dim fidelity so a different shipped
 * dims tier can be chosen later without re-calling the API.
 */

import { create, insertMultiple } from "@orama/orama";
import { persistToFile } from "@orama/plugin-data-persistence/server";
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ORAMA_SCHEMA, GERMAN_TOKENIZER, SHIPPED_INDEX_DIMS } from "./orama_schema.mjs";

const CACHE_DIMS = 3072; // full-fidelity dims stored in chunks.json / embeddings-cache/
const GENERATION_MODEL = "gemini-3.6-flash";
const GEN_PROVIDER_DEFAULT = "zen";
const QUERY_PREFIX_TEMPLATE = "task: search result | query: {content}";

function truncateAndRenormalize(vector, dims) {
  const truncated = vector.slice(0, dims);
  const norm = Math.sqrt(truncated.reduce((sum, x) => sum + x * x, 0));
  return norm > 0 ? truncated.map((x) => x / norm) : truncated;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHUNKS_PATH = path.join(__dirname, "chunks.json");
const PLUGIN_DIR = path.resolve(__dirname, "..", "..", "..", ".obsidian", "plugins", "rag-chat");
const INDEX_OUT = path.join(PLUGIN_DIR, "rag-index.orama.msp");
const MANIFEST_OUT = path.join(PLUGIN_DIR, "rag-manifest.json");

async function main() {
  console.log(`Reading ${CHUNKS_PATH} ...`);
  const raw = readFileSync(CHUNKS_PATH, "utf-8");
  const { model, dims, docPrefixTemplate, corpusHash, generatedAt, rows } = JSON.parse(raw);

  if (dims !== CACHE_DIMS) {
    throw new Error(`Expected ${CACHE_DIMS}-dim cached embeddings, chunks.json has ${dims}`);
  }
  console.log(`Loaded ${rows.length} rows (model=${model}, cacheDims=${dims})`);
  console.log(`Truncating + L2-renormalizing to ${SHIPPED_INDEX_DIMS} dims for the shipped index...`);

  const db = await create({
    schema: ORAMA_SCHEMA,
    components: { tokenizer: GERMAN_TOKENIZER },
  });

  const shippedRows = rows.map((r) => ({
    ...r,
    embedding: truncateAndRenormalize(r.embedding, SHIPPED_INDEX_DIMS),
  }));

  console.log("Inserting rows into Orama...");
  await insertMultiple(db, shippedRows, 200);

  console.log(`Persisting binary index to ${INDEX_OUT} ...`);
  await persistToFile(db, "binary", INDEX_OUT);

  const textCount = rows.filter((r) => r.kind === "text").length;
  const multimodalCount = rows.filter((r) => r.kind === "multimodal").length;
  const noteCount = new Set(rows.map((r) => r.notePath)).size;

  const manifest = {
    embeddingModel: model,
    embeddingDims: SHIPPED_INDEX_DIMS,
    cacheDims: CACHE_DIMS,
    docPrefixTemplate,
    queryPrefixTemplate: QUERY_PREFIX_TEMPLATE,
    generationModel: GENERATION_MODEL,
    genProviderDefault: GEN_PROVIDER_DEFAULT,
    noteCount,
    textChunkCount: textCount,
    multimodalCount,
    totalRowCount: rows.length,
    corpusHash,
    chunkedAt: generatedAt,
    builtAt: new Date().toISOString(),
  };
  writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2), "utf-8");

  const indexSize = statSync(INDEX_OUT).size;
  console.log();
  console.log(`Wrote ${INDEX_OUT} (${(indexSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`Wrote ${MANIFEST_OUT}`);
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
