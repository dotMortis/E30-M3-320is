#!/usr/bin/env python3
"""
build_rag_index.py — top-level orchestrator for the RAG indexer.
See .pipeline/rag/PLAN.md for the full design.

Pipeline:
  1. chunk.py        — parse the vault, build parent-note texts + chunk rows  (free, local)
  2. embed_gemini.py — embed every row via gemini-embedding-2                 (paid, Google key)
  3. build/build_orama.mjs (Node) — build the committed Orama index          (free, local)

Step 3 is invoked via `node` if available; run it manually otherwise
(see Phase 3 in PLAN.md). Steps 1-2 are the Python side and are what this
script actually drives.

Usage:
  .venv/bin/python3 build_rag_index.py --pilot 20     # spend checkpoint: embed only 20 rows
  .venv/bin/python3 build_rag_index.py                # full run (after reviewing the pilot)
  .venv/bin/python3 build_rag_index.py --skip-embed    # just re-run chunking (free)
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

import chunk as chunk_mod
import embed_gemini

RAG_DIR = Path(__file__).resolve().parent
BUILD_DIR = RAG_DIR / "build"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vault-root", type=Path, default=RAG_DIR.parents[1])
    parser.add_argument("--pilot", type=int, default=None, metavar="N", help="Embed only the first N rows")
    parser.add_argument("--skip-embed", action="store_true", help="Only run chunking (Phase 1), skip embedding")
    parser.add_argument("--skip-orama", action="store_true", help="Skip the Node build_orama.mjs step")
    parser.add_argument("--workers", type=int, default=embed_gemini.MAX_WORKERS)
    parser.add_argument("--limit-notes", type=int, default=None, help="Dev only: chunk only the first N notes")
    args = parser.parse_args()

    print("=== Phase 1: chunking ===")
    pre_embed_path = BUILD_DIR / "pre_embed.json"
    result = chunk_mod.process_vault(args.vault_root, limit=args.limit_notes)
    pre_embed_path.parent.mkdir(parents=True, exist_ok=True)
    pre_embed_path.write_text(__import__("json").dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Notes: {result['noteCount']}  Rows: {result['chunkCount']}  Wrote {pre_embed_path}")

    if args.skip_embed:
        print("\n--skip-embed set: stopping after chunking.")
        return

    print("\n=== Phase 2: embedding (gemini-embedding-2, Google key, PAID) ===")
    import json as _json

    rows = result["rows"]
    if args.pilot:
        rows = rows[: args.pilot]
        print(f"*** PILOT MODE: embedding only the first {args.pilot} rows ***")

    api_key = embed_gemini.load_gemini_key()
    from google import genai

    client = genai.Client(api_key=api_key)
    embed_gemini.CACHE_DIR.mkdir(parents=True, exist_ok=True)
    embedded_rows = embed_gemini.run(rows, client, workers=args.workers)

    chunks_path = BUILD_DIR / "chunks.json"
    out = {
        "model": embed_gemini.EMBEDDING_MODEL,
        "dims": embed_gemini.EMBEDDING_DIMS,
        "docPrefixTemplate": embed_gemini.DOC_PREFIX_TMPL,
        "corpusHash": result["corpusHash"],
        "generatedAt": result["generatedAt"],
        "rows": embedded_rows,
    }
    chunks_path.write_text(_json.dumps(out, ensure_ascii=False), encoding="utf-8")
    log = embed_gemini.rebuild_cost_log()
    print(f"Wrote {chunks_path}")
    print(f"Cache: {log['itemsCached']} items, est. total cost so far: ${log['estimatedCostUsd']:.4f}")

    if args.pilot:
        print("\n*** PILOT run complete. Review the numbers above before running a full build. ***")
        return

    if args.skip_orama:
        print("\n--skip-orama set: stopping before the Node build step.")
        return

    print("\n=== Phase 3: building Orama index (Node) ===")
    build_script = BUILD_DIR / "build_orama.mjs"
    if not build_script.exists():
        print(f"NOTE: {build_script} does not exist yet (Phase 3 not implemented). Skipping.")
        return
    if not shutil.which("node"):
        print("NOTE: `node` not found on PATH. Run build_orama.mjs manually once Node is available.")
        return
    subprocess.run(["node", str(build_script)], check=True, cwd=BUILD_DIR)


if __name__ == "__main__":
    main()
