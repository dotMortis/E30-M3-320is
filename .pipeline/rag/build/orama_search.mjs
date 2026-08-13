#!/usr/bin/env node
/**
 * orama_search.mjs — small reusable CLI wrapper around the shipped Orama
 * index, used by qa_rag.py (Python can't read the Orama binary format
 * directly). Mirrors exactly the search call the rag-chat plugin will make
 * at query time, so QA results are representative of real plugin behavior.
 *
 * Uses `loadIndex` from orama_schema.mjs, which reconstructs the db with the
 * German tokenizer intact (a bare `restoreFromFile` silently reverts to the
 * default English tokenizer — see orama_schema.mjs for why).
 *
 * Usage: echo '{"term":"...", "vector":[...], "mode":"hybrid", "similarity":0.75, "limit":8}' \
 *          | node orama_search.mjs
 * Output (stdout): JSON { hits: [{ score, notePath, seitencode, sektion, titel, kind }] }
 */
import { search } from "@orama/orama";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadIndex } from "./orama_schema.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = path.resolve(__dirname, "..", "..", "..", ".obsidian", "plugins", "rag-chat", "rag-index.orama.msp");

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

async function main() {
  const input = JSON.parse(await readStdin());
  const db = await loadIndex(INDEX_PATH);

  const params = {
    mode: input.mode || "hybrid",
    limit: input.limit || 8,
  };
  if (input.term) params.term = input.term;
  if (input.vector) {
    params.vector = { value: input.vector, property: "embedding" };
    params.similarity = input.similarity ?? 0.75;
  }
  if (input.hybridWeights) params.hybridWeights = input.hybridWeights;

  const result = await search(db, params);
  const hits = result.hits.map((h) => ({
    score: h.score,
    notePath: h.document.notePath,
    seitencode: h.document.seitencode,
    sektion: h.document.sektion,
    titel: h.document.titel,
    kind: h.document.kind,
  }));
  process.stdout.write(JSON.stringify({ count: result.count, hits }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
