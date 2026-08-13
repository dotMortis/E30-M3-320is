#!/usr/bin/env node
/**
 * orama_search.mjs — small reusable CLI wrapper around the shipped, SPLIT
 * Orama indices (one text index + N vector shards - see orama_schema.mjs's
 * "ARCHITECTURE" note), used by qa_rag.py (Python can't read the Orama
 * binary format directly). Mirrors exactly the federated search the
 * rag-chat plugin's retriever.ts makes at query time, so QA results are
 * representative of real plugin behavior.
 *
 * Merges the BM25 (text) and vector leg rankings via Reciprocal Rank Fusion
 * (rrfMerge below) - NOT the min-max score-sum this file used to implement.
 * Live benchmarking (see .pipeline/rag/PLAN.md's "Retrieval benchmark"
 * section) confirmed the min-max approach had a real flaw: normalizing each
 * leg to its own [0,1] range and summing means a document that is the
 * single BEST match on one leg (e.g. correct but entirely absent from BM25
 * due to German compound/separable-verb mismatches) caps at 0.5, while a
 * document merely mediocre on both legs can approach 1.0 - burying the
 * correct answer. See retriever.ts for the byte-for-byte-equivalent
 * TypeScript implementation (this file MUST stay in sync with it).
 *
 * Usage: echo '{"term":"...", "vector":[...], "mode":"hybrid", "similarity":0.55, "rrfK":2, "limit":8}' \
 *          | node orama_search.mjs
 * Output (stdout): JSON { count, hits: [{ score, notePath, seitencode, sektion, titel, kind }] }
 */
import { search } from "@orama/orama";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadTextIndex, loadVectorShard } from "./orama_schema.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_DIR = path.resolve(__dirname, "..", "..", "..", ".obsidian", "plugins", "rag-chat");
const MANIFEST_PATH = path.join(PLUGIN_DIR, "rag-manifest.json");

// Large enough to capture "every" ranked candidate on this corpus size, so
// the merge below sees the same full candidate set Orama's own single-DB
// hybrid mode would internally, before slicing down to the caller's limit.
const CANDIDATE_POOL_LIMIT = 5000;

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

function maxScore(hits) {
  return hits.reduce((m, h) => Math.max(m, h.score), 0);
}

/** Reciprocal Rank Fusion: score = sum over legs of 1/(k + rank), rank
 * 1-based within that leg's own ranking. See retriever.ts's rrfMerge (the
 * canonical implementation this must mirror) for the full rationale. Small
 * k (1-10) was empirically best on this corpus size (~2822 rows); the
 * common literature default of k=60 underperformed here. */
function rrfMerge(textHitsSorted, vectorHitsSorted, k) {
  const scores = new Map(); // rowId -> { score, doc }
  textHitsSorted.forEach((h, i) => {
    const rowId = h.document.rowId;
    const existing = scores.get(rowId);
    scores.set(rowId, { score: (existing?.score ?? 0) + 1 / (k + i + 1), doc: existing?.doc ?? h.document });
  });
  vectorHitsSorted.forEach((h, i) => {
    const rowId = h.document.rowId;
    const existing = scores.get(rowId);
    scores.set(rowId, { score: (existing?.score ?? 0) + 1 / (k + i + 1), doc: existing?.doc ?? h.document });
  });
  return [...scores.values()].sort((a, b) => b.score - a.score);
}

async function main() {
  const input = JSON.parse(await readStdin());
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
  const limit = input.limit || 8;
  const mode = input.mode || "hybrid";

  const textDb = await loadTextIndex(path.join(PLUGIN_DIR, manifest.textIndexFile));
  const vectorDbs = await Promise.all(
    Array.from({ length: manifest.vectorShardCount }, (_, i) =>
      loadVectorShard(path.join(PLUGIN_DIR, manifest.vectorIndexFilePattern.replace("{i}", String(i))))
    )
  );

  let textHits = [];
  if ((mode === "hybrid" || mode === "fulltext") && input.term) {
    const r = await search(textDb, { mode: "fulltext", term: input.term, limit: CANDIDATE_POOL_LIMIT });
    textHits = r.hits;
  }

  let vectorHits = [];
  if ((mode === "hybrid" || mode === "vector") && input.vector) {
    const perShard = await Promise.all(
      vectorDbs.map((db) =>
        search(db, {
          mode: "vector",
          vector: { value: input.vector, property: "embedding" },
          similarity: input.similarity ?? 0.55,
          limit: CANDIDATE_POOL_LIMIT,
        })
      )
    );
    vectorHits = perShard.flatMap((r) => r.hits);
  }

  let ranked;
  if (mode === "fulltext") {
    ranked = [...textHits].sort((a, b) => b.score - a.score).map((h) => ({ score: h.score, doc: h.document }));
  } else if (mode === "vector") {
    ranked = [...vectorHits].sort((a, b) => b.score - a.score).map((h) => ({ score: h.score, doc: h.document }));
  } else {
    const textHitsSorted = [...textHits].sort((a, b) => b.score - a.score);
    const vectorHitsSorted = [...vectorHits].sort((a, b) => b.score - a.score);
    ranked = rrfMerge(textHitsSorted, vectorHitsSorted, input.rrfK ?? 2);
  }

  const hits = ranked.slice(0, limit).map(({ score, doc }) => ({
    score,
    notePath: doc.notePath,
    seitencode: doc.seitencode,
    sektion: doc.sektion,
    titel: doc.titel,
    kind: doc.kind,
  }));
  process.stdout.write(JSON.stringify({ count: ranked.length, hits }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
