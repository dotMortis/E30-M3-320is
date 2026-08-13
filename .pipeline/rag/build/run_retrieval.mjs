#!/usr/bin/env node
// Runs fulltext, vector, and hybrid search (mirroring retriever.ts's
// federatedHybridSearch + orama_search.mjs) for every benchmark query,
// against the real shipped index. No network calls here - vectors were
// already embedded once by embed_queries.py.
import { search } from "@orama/orama";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadTextIndex, loadVectorShard } from "./orama_schema.mjs";

const PLUGIN_DIR = "/home/nick.koellhofer/Projects/E30-M3-320is/.obsidian/plugins/rag-chat";
const manifest = JSON.parse(readFileSync(path.join(PLUGIN_DIR, "rag-manifest.json"), "utf-8"));
const queries = JSON.parse(readFileSync("/tmp/opencode/benchmark_queries.json", "utf-8"));
const vectors = JSON.parse(readFileSync("/tmp/opencode/benchmark_vectors.json", "utf-8"));

const CANDIDATE_POOL_LIMIT = 5000;
const SIMILARITY = Number(process.env.SIM_OVERRIDE || 0.75);
const TOPK = 8;

function maxScore(hits) {
  return hits.reduce((m, h) => Math.max(m, h.score), 0);
}

function federatedMerge(textHits, vectorHits, textWeight = 0.5, vectorWeight = 0.5) {
  const maxText = maxScore(textHits);
  const maxVector = maxScore(vectorHits);
  const merged = new Map();
  for (const h of textHits) {
    const normalized = maxText > 0 ? h.score / maxText : 0;
    const rowId = h.document.rowId;
    const existing = merged.get(rowId);
    merged.set(rowId, { score: (existing?.score ?? 0) + normalized * textWeight, doc: existing?.doc ?? h.document });
  }
  for (const h of vectorHits) {
    const normalized = maxVector > 0 ? h.score / maxVector : 0;
    const rowId = h.document.rowId;
    const existing = merged.get(rowId);
    merged.set(rowId, { score: (existing?.score ?? 0) + normalized * vectorWeight, doc: existing?.doc ?? h.document });
  }
  return [...merged.values()].sort((a, b) => b.score - a.score);
}

function rrfMerge(textHitsSorted, vectorHitsSorted, k = Number(process.env.RRF_K || 60)) {
  // Reciprocal Rank Fusion: score = sum over legs of 1/(k + rank), rank is
  // 1-based within that leg's own ranking. Unlike min-max score fusion, a
  // document ranked #1 in ONE leg gets a strong fixed contribution
  // regardless of whether/how it ranks in the other leg - it can't be
  // buried by a document that's merely mediocre-but-present on both legs.
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

function dedupeByNotePath(ranked) {
  const seen = new Set();
  const out = [];
  for (const { score, doc } of ranked) {
    if (seen.has(doc.notePath)) continue;
    seen.add(doc.notePath);
    out.push({ score, notePath: doc.notePath, seitencode: doc.seitencode, titel: doc.titel, kind: doc.kind });
  }
  return out;
}

async function main() {
  const textDb = await loadTextIndex(path.join(PLUGIN_DIR, manifest.textIndexFile));
  const vectorDbs = await Promise.all(
    Array.from({ length: manifest.vectorShardCount }, (_, i) =>
      loadVectorShard(path.join(PLUGIN_DIR, manifest.vectorIndexFilePattern.replace("{i}", String(i))))
    )
  );

  const results = {};
  for (const q of queries) {
    const term = q.query;
    const vector = vectors[q.id];

    const textResult = await search(textDb, { mode: "fulltext", term, limit: CANDIDATE_POOL_LIMIT });
    const vectorResultsPerShard = await Promise.all(
      vectorDbs.map((db) =>
        search(db, { mode: "vector", vector: { value: vector, property: "embedding" }, similarity: SIMILARITY, limit: CANDIDATE_POOL_LIMIT })
      )
    );
    const vectorHits = vectorResultsPerShard.flatMap((r) => r.hits);

    const bm25Ranked = [...textResult.hits].sort((a, b) => b.score - a.score).map((h) => ({ score: h.score, doc: h.document }));
    const vectorRanked = [...vectorHits].sort((a, b) => b.score - a.score).map((h) => ({ score: h.score, doc: h.document }));
    const hybridRanked = federatedMerge(textResult.hits, vectorHits, 0.5, 0.5);
    const textHitsSorted = [...textResult.hits].sort((a, b) => b.score - a.score);
    const vectorHitsSorted = [...vectorHits].sort((a, b) => b.score - a.score);
    const rrfRanked = rrfMerge(textHitsSorted, vectorHitsSorted);

    results[q.id] = {
      query: term,
      bm25: dedupeByNotePath(bm25Ranked).slice(0, TOPK),
      vector: dedupeByNotePath(vectorRanked).slice(0, TOPK),
      hybrid: dedupeByNotePath(hybridRanked).slice(0, TOPK),
      rrf: dedupeByNotePath(rrfRanked).slice(0, TOPK),
      vectorRawHitCount: vectorHits.length,
    };
    console.error(`done: ${q.id}`);
  }

  writeFileSync("/tmp/opencode/retrieval_results.json", JSON.stringify(results, null, 2));
  console.error("Wrote /tmp/opencode/retrieval_results.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
