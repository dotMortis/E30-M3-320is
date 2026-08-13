#!/usr/bin/env python3
"""
embed_gemini.py — Phase 2 of the RAG indexer (see .pipeline/rag/PLAN.md).

Reads build/pre_embed.json (from chunk.py) and calls Google's
`gemini-embedding-2` for every row, writing build/chunks.json with an
"embedding" field added to each row. Costs real money (Google GEMINI_API_KEY,
paid Tier-1 budget) — this is the only paid step in the whole pipeline.

IMPORTANT model-behavior notes (verified against live Google AI docs, Aug
2026 — see PLAN.md "Confirmed decisions" for the full writeup):
  - `gemini-embedding-2` has NO `task_type` EmbedContentConfig param (that's
    `-001`-only). Task steering is a TEXT PREFIX baked into the input string:
      documents: DOC_PREFIX_TMPL   = "title: {title} | text: {content}"
      queries:   QUERY_PREFIX_TMPL = "task: search result | query: {content}"
    (this module only ever builds document-side prefixes; query-side prefixing
    happens in the plugin at chat time.)
  - `gemini-embedding-2` AGGREGATES every input in one request's `contents`
    list into a SINGLE vector. So each text chunk gets its OWN API call.
    The multimodal note vector deliberately exploits this: image + Beschreibung
    text passed together in ONE call, on purpose, to get one combined vector.
  - The plain Gemini Developer API (GEMINI_API_KEY) does NOT return usage/
    token metadata on embedding responses (that's Enterprise-platform-only).
    Cost is estimated client-side from our own tokenizer at published rates:
    $0.20/1M text tokens, $0.45/1M image tokens (~258 tokens/image).

Resumable: every embedded row is cached in embeddings-cache/<sha256>.json
keyed on (model, dims, prefix template, exact input content). Reruns only
call the API for new/changed rows. A running cost log is kept in
embeddings-cache/cost_log.json (rebuilt from cache contents on each run, same
pattern as .pipeline/scripts/analyze.py).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from google import genai
from google.genai import errors, types

import chunk as chunk_mod  # reuse count_tokens()

# --- Config constants (mirrored from PLAN.md "Config constants" table) -----
EMBEDDING_MODEL = "gemini-embedding-2"
EMBEDDING_DIMS = 3072
DOC_PREFIX_TMPL = "title: {title} | text: {content}"
PREFIX_TEMPLATE_ID = "doc-v1"  # bump if DOC_PREFIX_TMPL changes, to bust the cache correctly

PRICE_PER_1M_TEXT_TOKENS = 0.20
PRICE_PER_1M_IMAGE_TOKENS = 0.45
TOKENS_PER_IMAGE = 258  # per gemini-embedding-2 docs (fixed per-image token cost)

MAX_WORKERS = 6
MAX_RETRIES = 5
RETRY_BASE_DELAY = 2.0  # seconds, exponential backoff base

REPO_ROOT = Path(__file__).resolve().parents[2]
RAG_DIR = Path(__file__).resolve().parent
ENV_FILE = REPO_ROOT / ".env"
CACHE_DIR = RAG_DIR / "embeddings-cache"


def load_gemini_key() -> str:
    """Mirrors the .env parsing pattern used by .pipeline/scripts/analyze.py."""
    key = None
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            if k.strip() == "GEMINI_API_KEY":
                key = v.strip().strip('"').strip("'")
    import os

    key = key or os.environ.get("GEMINI_API_KEY")
    if not key:
        sys.exit("ERROR: GEMINI_API_KEY not found in .env or environment.")
    return key


def cache_key_for_text(text_input: str) -> str:
    sig = f"{EMBEDDING_MODEL}|{EMBEDDING_DIMS}|{PREFIX_TEMPLATE_ID}|text|{text_input}"
    return hashlib.sha256(sig.encode()).hexdigest()


def cache_key_for_multimodal(image_bytes: bytes, description_text_input: str) -> str:
    image_hash = hashlib.sha256(image_bytes).hexdigest()
    sig = f"{EMBEDDING_MODEL}|{EMBEDDING_DIMS}|{PREFIX_TEMPLATE_ID}|multimodal|{image_hash}|{description_text_input}"
    return hashlib.sha256(sig.encode()).hexdigest()


def cache_path(key: str) -> Path:
    return CACHE_DIR / f"{key}.json"


def estimate_text_cost(token_count: int) -> float:
    return token_count / 1_000_000 * PRICE_PER_1M_TEXT_TOKENS


def estimate_image_cost(image_count: int = 1) -> float:
    return (image_count * TOKENS_PER_IMAGE) / 1_000_000 * PRICE_PER_1M_IMAGE_TOKENS


def embed_with_retry(client: genai.Client, contents: list, config: types.EmbedContentConfig):
    last_err = None
    for attempt in range(MAX_RETRIES):
        try:
            return client.models.embed_content(model=EMBEDDING_MODEL, contents=contents, config=config)
        except errors.APIError as e:
            last_err = e
            if e.code in (429, 500, 503) and attempt < MAX_RETRIES - 1:
                delay = RETRY_BASE_DELAY * (2**attempt)
                print(f"  WARN: HTTP {e.code}, retrying in {delay:.0f}s ({e.message[:120]})", file=sys.stderr)
                time.sleep(delay)
                continue
            raise
    raise last_err  # pragma: no cover


def embed_text_row(client: genai.Client, row: dict) -> dict:
    """Returns {key, embedding, tokenCount, cost} for a single text chunk row."""
    input_text = DOC_PREFIX_TMPL.format(title=row["titel"], content=row["text"])
    key = cache_key_for_text(input_text)
    cached = cache_path(key)
    if cached.exists():
        return json.loads(cached.read_text(encoding="utf-8"))

    token_count = chunk_mod.count_tokens(input_text)
    resp = embed_with_retry(
        client,
        contents=[input_text],
        config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIMS),
    )
    embedding = resp.embeddings[0].values
    result = {
        "key": key,
        "embedding": embedding,
        "tokenCount": token_count,
        "cost": estimate_text_cost(token_count),
    }
    cached.parent.mkdir(parents=True, exist_ok=True)
    cached.write_text(json.dumps(result), encoding="utf-8")
    return result


def embed_multimodal_row(client: genai.Client, row: dict) -> dict:
    """Returns {key, embedding, tokenCount, cost} for a note's image+description vector."""
    image_path = REPO_ROOT / row["imagePath"]
    image_bytes = image_path.read_bytes()
    input_text = DOC_PREFIX_TMPL.format(title=row["titel"], content=row["text"])
    key = cache_key_for_multimodal(image_bytes, input_text)
    cached = cache_path(key)
    if cached.exists():
        return json.loads(cached.read_text(encoding="utf-8"))

    mime_type = "image/jpeg" if image_path.suffix.lower() in (".jpg", ".jpeg") else "image/png"
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    text_token_count = chunk_mod.count_tokens(input_text)

    resp = embed_with_retry(
        client,
        contents=[input_text, image_part],
        config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIMS),
    )
    embedding = resp.embeddings[0].values
    cost = estimate_text_cost(text_token_count) + estimate_image_cost(1)
    result = {
        "key": key,
        "embedding": embedding,
        "tokenCount": text_token_count,
        "imageCount": 1,
        "cost": cost,
    }
    cached.parent.mkdir(parents=True, exist_ok=True)
    cached.write_text(json.dumps(result), encoding="utf-8")
    return result


def rebuild_cost_log() -> dict:
    """Sums cost across every cached item (resumable, restart-safe — mirrors analyze.py)."""
    total_cost = 0.0
    total_tokens = 0
    total_images = 0
    n_items = 0
    for f in CACHE_DIR.glob("*.json"):
        if f.name == "cost_log.json":
            continue
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        total_cost += data.get("cost", 0.0)
        total_tokens += data.get("tokenCount", 0)
        total_images += data.get("imageCount", 0)
        n_items += 1
    log = {
        "itemsCached": n_items,
        "totalTokens": total_tokens,
        "totalImages": total_images,
        "estimatedCostUsd": round(total_cost, 4),
    }
    (CACHE_DIR / "cost_log.json").write_text(json.dumps(log, indent=2), encoding="utf-8")
    return log


def run(rows: list[dict], client: genai.Client, workers: int = MAX_WORKERS) -> list[dict]:
    """Embeds all rows (mutating copies with an 'embedding' key), with a thread
    pool for concurrency and a resumable per-item cache. Returns the rows with
    embeddings attached, in the original order.
    """
    out_rows = [dict(r) for r in rows]

    def _work(i: int, row: dict):
        if row["kind"] == "multimodal":
            result = embed_multimodal_row(client, row)
        else:
            # "text" (page-note chunk) and "reference" (standalone reference
            # doc chunk, see chunk.py's REFERENCE_DOCS) both embed the same
            # way - plain text, no image.
            result = embed_text_row(client, row)
        return i, result

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(_work, i, row) for i, row in enumerate(rows)]
        done = 0
        for fut in as_completed(futures):
            i, result = fut.result()
            out_rows[i]["embedding"] = result["embedding"]
            done += 1
            if done % 25 == 0 or done == len(rows):
                log = rebuild_cost_log()
                print(
                    f"  embedded {done}/{len(rows)} "
                    f"(cached items: {log['itemsCached']}, est. cost so far: ${log['estimatedCostUsd']:.4f})"
                )

    return out_rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--in", dest="in_path", type=Path, default=RAG_DIR / "build" / "pre_embed.json", help="pre_embed.json from chunk.py"
    )
    parser.add_argument("--out", type=Path, default=RAG_DIR / "build" / "chunks.json", help="Output path for chunks.json")
    parser.add_argument(
        "--pilot",
        type=int,
        default=None,
        metavar="N",
        help="Only embed the first N rows (spend checkpoint before a full run)",
    )
    parser.add_argument("--workers", type=int, default=MAX_WORKERS, help="Concurrent API calls")
    args = parser.parse_args()

    if not args.in_path.exists():
        sys.exit(f"ERROR: {args.in_path} not found — run chunk.py first.")

    pre_embed = json.loads(args.in_path.read_text(encoding="utf-8"))
    rows = pre_embed["rows"]
    if args.pilot:
        rows = rows[: args.pilot]

    text_rows = [r for r in rows if r["kind"] == "text"]
    multimodal_rows = [r for r in rows if r["kind"] == "multimodal"]
    reference_rows = [r for r in rows if r["kind"] == "reference"]
    print(
        f"Rows to embed: {len(rows)} ({len(text_rows)} text, {len(multimodal_rows)} multimodal, "
        f"{len(reference_rows)} reference)"
    )
    if args.pilot:
        print(f"*** PILOT MODE: limited to first {args.pilot} rows ***")

    api_key = load_gemini_key()
    client = genai.Client(api_key=api_key)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    start = time.time()
    embedded_rows = run(rows, client, workers=args.workers)
    elapsed = time.time() - start

    out = {
        "model": EMBEDDING_MODEL,
        "dims": EMBEDDING_DIMS,
        "docPrefixTemplate": DOC_PREFIX_TMPL,
        "corpusHash": pre_embed["corpusHash"],
        "generatedAt": pre_embed["generatedAt"],
        "rows": embedded_rows,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")

    log = rebuild_cost_log()
    print()
    print(f"Done in {elapsed:.1f}s. Wrote {args.out}")
    print(f"Cache: {log['itemsCached']} items, {log['totalTokens']} text tokens, {log['totalImages']} images")
    print(f"Estimated total cost so far (all cached runs): ${log['estimatedCostUsd']:.4f}")
    if args.pilot:
        print()
        print("*** This was a PILOT run. Review cost/output above, then run the full build with:")
        print(f"    .venv/bin/python3 embed_gemini.py --in {args.in_path} --out {args.out}")


if __name__ == "__main__":
    main()
