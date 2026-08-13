#!/usr/bin/env node
/**
 * build_orama.mjs — Phase 3 of the RAG indexer (see .pipeline/rag/PLAN.md
 * and orama_schema.mjs's "ARCHITECTURE" note for the full rationale).
 *
 * Reads ./chunks.json (produced by embed_gemini.py) and builds:
 *   - ONE text-only BM25 index (full corpus, correct global IDF stats)
 *   - N vector-only shards at FULL 3072-dim fidelity (no truncation)
 *   - a reference-chunks.json sidecar (rowId -> chunk text) for `kind:
 *     "reference"` rows (standalone docs like Sonderwerkzeuge.md - see the
 *     sidecar's own comment below for why they can't use the page-note
 *     full-file "Parent Note" pattern)
 * plus a manifest, all written into the shipped plugin directory:
 *   .obsidian/plugins/rag-chat/rag-index-text.orama.msp
 *   .obsidian/plugins/rag-chat/rag-index-vectors-0.orama.msp ... -{N-1}.orama.msp
 *   .obsidian/plugins/rag-chat/reference-chunks.json
 *   .obsidian/plugins/rag-chat/rag-manifest.json
 *
 * WHY SPLIT INDICES (see orama_schema.mjs for the full writeup): GitHub
 * hard-blocks any pushed file over 100MB. A single hybrid index (BM25 +
 * vectors together) at full 3072 dims measures ~165MB for this corpus - too
 * big, and Matryoshka-truncating to fit in one file is lossy. Splitting BM25
 * (tiny, no float arrays) into its own single unsharded file and vectors
 * (the bulk of the size) into N shards lets us ship full-fidelity vectors
 * with zero quality loss, at the cost of doing the hybrid score merge by
 * hand in retriever.ts instead of relying on Orama's single-instance hybrid
 * mode (see orama_schema.mjs for why that's safe: vector scores are raw,
 * non-corpus-relative cosine similarities, so they merge correctly across
 * shards; BM25/IDF is corpus-relative, which is exactly why it stays
 * unsharded).
 *
 * SHARD COUNT: determined empirically, not estimated. We build ONE
 * monolithic vector-only Orama db first, persist it to a scratch file to
 * measure its real on-disk size (accounts for this exact Orama version's
 * binary format overhead), then split rows into N ceil(size/TARGET) roughly
 * equal partitions and rebuild N smaller shard dbs from those partitions.
 *
 * API notes (verified live against @orama/orama 3.1.18 + plugin-data-
 * persistence 3.1.18, Aug 2026):
 *   - create/insertMultiple/search are all async (`await`) in Orama v3.
 *   - File-based persistence lives in `@orama/plugin-data-persistence/server`
 *     as `persistToFile`/`restoreFromFile`.
 *   - Fields not declared in the schema still ride along on each document in
 *     Orama's document store - so stripping `embedding`/`text` from row
 *     objects BEFORE insert (not just omitting them from the schema) is
 *     required to actually keep the text index small and avoid bloating it
 *     right back up with undeclared vector data.
 *   - `enum` schema fields need `where: { field: { eq: value } } }` filter
 *     syntax, not a bare value.
 */

import { create, insertMultiple } from "@orama/orama";
import { persistToFile } from "@orama/plugin-data-persistence/server";
import { readFileSync, writeFileSync, statSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { TEXT_SCHEMA, VECTOR_SCHEMA, GERMAN_TOKENIZER, EMBEDDING_DIMS, buildRowId } from "./orama_schema.mjs";

const CACHE_DIMS = 3072; // full-fidelity dims stored in chunks.json / embeddings-cache/
const GENERATION_MODEL = "gemini-3.6-flash";
const QUERY_PREFIX_TEMPLATE = "task: search result | query: {content}";
const TARGET_SHARD_BYTES = 80 * 1024 * 1024; // ~80MB/file target, safe margin under GitHub's 100MB hard block

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHUNKS_PATH = path.join(__dirname, "chunks.json");
const PLUGIN_DIR = path.resolve(__dirname, "..", "..", "..", ".obsidian", "plugins", "rag-chat");
const TEXT_INDEX_OUT = path.join(PLUGIN_DIR, "rag-index-text.orama.msp");
const VECTOR_SHARD_PATH = (i) => path.join(PLUGIN_DIR, `rag-index-vectors-${i}.orama.msp`);
const SCRATCH_PATH = path.join(__dirname, ".vector-scratch.orama.msp");
const MANIFEST_OUT = path.join(PLUGIN_DIR, "rag-manifest.json");
const REFERENCE_CHUNKS_OUT = path.join(PLUGIN_DIR, "reference-chunks.json");

function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(1);
}

/** Strips `keys` from a row (shallow copy, does not mutate input). */
function omit(row, keys) {
  const out = { ...row };
  for (const k of keys) delete out[k];
  return out;
}

async function buildVectorDb(rows) {
  const db = await create({ schema: VECTOR_SCHEMA });
  await insertMultiple(db, rows.map((r) => omit(r, ["text"])), 200);
  return db;
}

async function main() {
  console.log(`Reading ${CHUNKS_PATH} ...`);
  const raw = readFileSync(CHUNKS_PATH, "utf-8");
  const { model, dims, docPrefixTemplate, corpusHash, generatedAt, rows: rawRows } = JSON.parse(raw);

  if (dims !== CACHE_DIMS) {
    throw new Error(`Expected ${CACHE_DIMS}-dim cached embeddings, chunks.json has ${dims}`);
  }
  if (CACHE_DIMS !== EMBEDDING_DIMS) {
    throw new Error(`orama_schema.mjs EMBEDDING_DIMS (${EMBEDDING_DIMS}) must match CACHE_DIMS (${CACHE_DIMS})`);
  }
  console.log(`Loaded ${rawRows.length} rows (model=${model}, dims=${dims})`);

  const rows = rawRows.map((r) => ({ ...r, rowId: buildRowId(r) }));
  const rowIds = new Set(rows.map((r) => r.rowId));
  if (rowIds.size !== rows.length) {
    throw new Error(`rowId collisions detected (${rows.length} rows, ${rowIds.size} unique rowIds) - check chunk.py's notePath/kind/chunkIndex fields`);
  }

  // --- Text-only BM25 index (single file, full corpus, correct IDF) ---
  console.log("Building text-only index (BM25, full corpus, no embedding field)...");
  const textDb = await create({
    schema: TEXT_SCHEMA,
    components: { tokenizer: GERMAN_TOKENIZER },
  });
  await insertMultiple(textDb, rows.map((r) => omit(r, ["embedding"])), 200);
  console.log(`Persisting text index to ${TEXT_INDEX_OUT} ...`);
  await persistToFile(textDb, "binary", TEXT_INDEX_OUT);
  const textIndexBytes = statSync(TEXT_INDEX_OUT).size;
  console.log(`  -> ${mb(textIndexBytes)} MB`);
  if (textIndexBytes > 100 * 1024 * 1024) {
    console.warn(`WARNING: text index is ${mb(textIndexBytes)} MB, over GitHub's 100MB limit!`);
  }

  // --- Vector-only shards (measure-then-split: build once monolithically to
  // get a real byte-size measurement, then partition into N shards) ---
  console.log("Building scratch monolithic vector-only index to measure real size...");
  const scratchDb = await buildVectorDb(rows);
  await persistToFile(scratchDb, "binary", SCRATCH_PATH);
  const monolithicBytes = statSync(SCRATCH_PATH).size;
  unlinkSync(SCRATCH_PATH);
  console.log(`  -> monolithic vector index would be ${mb(monolithicBytes)} MB`);

  const shardCount = Math.max(1, Math.ceil(monolithicBytes / TARGET_SHARD_BYTES));
  console.log(`Splitting ${rows.length} rows into ${shardCount} vector shard(s) (target ~${mb(TARGET_SHARD_BYTES)} MB each)...`);

  const shardSize = Math.ceil(rows.length / shardCount);
  const vectorShardBytes = [];
  for (let i = 0; i < shardCount; i++) {
    const shardRows = rows.slice(i * shardSize, (i + 1) * shardSize);
    if (shardRows.length === 0) continue;
    const shardDb = await buildVectorDb(shardRows);
    const outPath = VECTOR_SHARD_PATH(i);
    await persistToFile(shardDb, "binary", outPath);
    const size = statSync(outPath).size;
    vectorShardBytes.push(size);
    console.log(`  shard ${i}: ${shardRows.length} rows -> ${path.basename(outPath)} (${mb(size)} MB)`);
    if (size > 100 * 1024 * 1024) {
      console.warn(`  WARNING: shard ${i} is ${mb(size)} MB, over GitHub's 100MB limit! Lower TARGET_SHARD_BYTES and rerun.`);
    }
  }

  const textCount = rows.filter((r) => r.kind === "text").length;
  const multimodalCount = rows.filter((r) => r.kind === "multimodal").length;
  const referenceRows = rows.filter((r) => r.kind === "reference");
  const noteCount = new Set(rows.map((r) => r.notePath)).size;

  // --- Reference-chunk sidecar (rowId -> chunk text + titel + notePath) ---
  // Reference docs (Sonderwerkzeuge.md, Sicherheitshinweise.md, the Glossar
  // letter-files, Technische-Daten.md - see chunk.py's REFERENCE_DOCS) are
  // 14-81KB standalone documents, not ~1-3KB manual pages. The plugin's
  // "Parent Note" pattern (read the WHOLE source file via vault.read on any
  // matching hit) is correct for a page note but would inject an entire
  // reference doc into context on every hit. Instead retriever.ts's
  // expandToParentNotes() looks up JUST the matched chunk's text here for
  // `kind === "reference"` hits (a vector-only hit has no `text` field in
  // its own shard - see VECTOR_SCHEMA - so this sidecar is the only
  // reliable source for that text, not the text index, which a hit might
  // not have matched into if it came purely from the vector leg).
  const referenceChunks = Object.fromEntries(
    referenceRows.map((r) => [r.rowId, { text: r.text, titel: r.titel, notePath: r.notePath }])
  );
  writeFileSync(REFERENCE_CHUNKS_OUT, JSON.stringify(referenceChunks), "utf-8");
  const referenceChunksBytes = statSync(REFERENCE_CHUNKS_OUT).size;
  console.log(`Wrote ${REFERENCE_CHUNKS_OUT} (${referenceRows.length} chunks, ${mb(referenceChunksBytes)} MB)`);

  const manifest = {
    embeddingModel: model,
    embeddingDims: EMBEDDING_DIMS,
    docPrefixTemplate,
    queryPrefixTemplate: QUERY_PREFIX_TEMPLATE,
    generationModel: GENERATION_MODEL,
    noteCount,
    textChunkCount: textCount,
    multimodalCount,
    referenceChunkCount: referenceRows.length,
    referenceDocCount: new Set(referenceRows.map((r) => r.notePath)).size,
    referenceChunksFile: path.basename(REFERENCE_CHUNKS_OUT),
    totalRowCount: rows.length,
    textIndexFile: path.basename(TEXT_INDEX_OUT),
    textIndexBytes,
    vectorShardCount: vectorShardBytes.length,
    vectorIndexFilePattern: "rag-index-vectors-{i}.orama.msp",
    vectorShardBytes,
    corpusHash,
    chunkedAt: generatedAt,
    builtAt: new Date().toISOString(),
  };
  writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2), "utf-8");

  console.log();
  console.log(`Wrote ${MANIFEST_OUT}`);
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
