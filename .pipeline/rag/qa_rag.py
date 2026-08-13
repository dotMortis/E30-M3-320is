#!/usr/bin/env python3
"""
qa_rag.py — offline retrieval QA against the built Orama index.
See .pipeline/rag/PLAN.md "Testing strategy" and Phase 5.

Runs a fixed query set with expected `notePath`s (the unique key — NOT
`seitencode`, which has 47 known collisions across the vault) and asserts
each expected note appears in the top-K hits. Prints rank + score for
tuning TOP_K / SIMILARITY.

Cost note: each query is embedded via the real Google API (gemini-embedding-2,
output_dimensionality=3072, full fidelity, matching the shipped index) so
results reflect actual plugin behavior. This is a handful of tiny queries (a
few cents' fraction of a cent total) — not "free" in the absolute sense, but
negligible, and the only paid step is the query embedding, not any LLM call
(no generation used here — see test_generate.py for that).

Since Python cannot read Orama's binary index format directly, the actual
search is delegated to build/orama_search.mjs (Node) via subprocess — the
exact same federated (text index + vector shards) call shape the rag-chat
plugin will make at query time.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from google import genai
from google.genai import types

import embed_gemini as eg

RAG_DIR = Path(__file__).resolve().parent
SEARCH_SCRIPT = RAG_DIR / "build" / "orama_search.mjs"
MANIFEST_PATH = RAG_DIR.parents[1] / ".obsidian" / "plugins" / "rag-chat" / "rag-manifest.json"

TOP_K = 8
# NOTE: 0.75 (the old default) was empirically confirmed via live benchmarking
# (see PLAN.md's "Retrieval benchmark" section) to return ZERO vector-leg
# candidates on every tested natural-language query - real cosine similarity
# for even the exact correct document topped out around 0.59-0.74 on this
# corpus. 0.55 matches the shipped plugin's new default (see settings.ts).
SIMILARITY = 0.55
RRF_K = 2  # matches settings.ts's new default rrfK; small k beat the literature default of 60 here.

# Fixed query set (see PLAN.md Phase 5). Expected note identified by notePath
# (unique) — seitencode alone is not a reliable identity key in this vault.
QUERIES = [
    {
        "label": "torque query (exact spec lookup)",
        "query": "Anzugsdrehmoment Zylinderkopf",
        "expected_note_path": (
            "BMW N 600 02.0 - Anzugsdrehmomente/"
            "Anziehdrehmomente Hauptlagerschrauben Kurbelgehaeuse (11-0xx)/"
            "11-09 — Anzugsdrehmomente Zylinderkopfschrauben.md"
        ),
        "validates": "BM25 exact-term-match leg",
    },
    {
        "label": "exact engine code lookup",
        "query": "S14 B23",
        "expected_note_path": "11 - Motor/11-100 — Motorübersicht S14 B20 B23.md",
        "validates": "BM25 exact alphanumeric-code-match leg",
    },
    {
        "label": "vague visual description",
        "query": "silbernes Blech hinter dem Ansaugkrümmer",
        "expected_note_path": (
            "BMW N 600 02.0 - Anzugsdrehmomente/"
            "Anziehdrehmomente Hauptlagerschrauben Kurbelgehaeuse (11-0xx)/"
            "11-33 — Anzugsdrehmomente Ansaugkrümmer und Schallschutzhaube.md"
        ),
        "validates": "vector / multimodal leg (no literal keyword overlap)",
    },
]


def check_manifest_parity():
    if not MANIFEST_PATH.exists():
        sys.exit(f"ERROR: {MANIFEST_PATH} not found — run build_orama.mjs first (Phase 3).")
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if manifest["embeddingModel"] != eg.EMBEDDING_MODEL:
        sys.exit(
            f"ERROR: embedding-parity mismatch. Index built with model={manifest['embeddingModel']!r}, "
            f"qa_rag.py expects {eg.EMBEDDING_MODEL!r}."
        )
    if manifest["embeddingDims"] != 3072:
        sys.exit(
            f"ERROR: embedding-parity mismatch. Index built with dims={manifest['embeddingDims']}, "
            f"qa_rag.py queries at 3072 (full fidelity, no truncation)."
        )
    return manifest


def embed_query(client: genai.Client, query: str) -> list[float]:
    prefixed = f"task: search result | query: {query}"
    resp = client.models.embed_content(
        model=eg.EMBEDDING_MODEL,
        contents=[prefixed],
        config=types.EmbedContentConfig(output_dimensionality=3072),
    )
    return resp.embeddings[0].values


def orama_search(
    term: str, vector: list[float], mode: str = "hybrid", similarity: float = SIMILARITY, limit: int = TOP_K, rrf_k: int = RRF_K
) -> dict:
    payload = {"term": term, "vector": vector, "mode": mode, "similarity": similarity, "limit": limit, "rrfK": rrf_k}
    proc = subprocess.run(
        ["node", str(SEARCH_SCRIPT)],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        cwd=SEARCH_SCRIPT.parent,
    )
    if proc.returncode != 0:
        sys.exit(f"ERROR: orama_search.mjs failed:\n{proc.stderr}")
    return json.loads(proc.stdout)


def main():
    manifest = check_manifest_parity()
    print(f"Index: {manifest['totalRowCount']} rows, {manifest['noteCount']} notes, "
          f"model={manifest['embeddingModel']}, dims={manifest['embeddingDims']}")
    print(f"corpusHash={manifest['corpusHash'][:16]}...  builtAt={manifest['builtAt']}")
    print()

    api_key = eg.load_gemini_key()
    client = genai.Client(api_key=api_key)

    all_passed = True
    for spec in QUERIES:
        print(f"=== {spec['label']} ===  (validates: {spec['validates']})")
        print(f"  query: {spec['query']!r}")
        vector = embed_query(client, spec["query"])
        result = orama_search(spec["query"], vector, similarity=SIMILARITY, limit=TOP_K)

        found_rank = None
        seen_note_paths = []
        for i, hit in enumerate(result["hits"]):
            if hit["notePath"] not in seen_note_paths:
                seen_note_paths.append(hit["notePath"])
            if hit["notePath"] == spec["expected_note_path"] and found_rank is None:
                found_rank = len(seen_note_paths)  # rank among de-duplicated notePaths

        status = "PASS" if found_rank else "FAIL"
        if not found_rank:
            all_passed = False
        print(f"  expected: {spec['expected_note_path']}")
        print(f"  [{status}] rank among unique notes: {found_rank or 'not found in top-' + str(TOP_K)}")
        for i, hit in enumerate(result["hits"][:5]):
            marker = " <== expected" if hit["notePath"] == spec["expected_note_path"] else ""
            print(f"    {i+1}. score={hit['score']:.4f} [{hit['kind']:>10}] {hit['seitencode']:>14} {hit['titel']}{marker}")
        print()

    print("=" * 60)
    print("ALL PASSED" if all_passed else "SOME QUERIES FAILED — consider tuning TOP_K/SIMILARITY")
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
