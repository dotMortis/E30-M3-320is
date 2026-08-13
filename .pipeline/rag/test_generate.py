#!/usr/bin/env python3
"""
test_generate.py — end-to-end generation smoke test (Phase 5, see PLAN.md).

Runs the FULL pipeline for a handful of canned questions: embed query
(Google) -> hybrid search (Orama, via build/orama_search.mjs) -> parent-note
expansion (reads full notes directly from the vault, mirroring the plugin's
vault.read) -> generate an answer via gen_client.py (Zen `gemini-3.6-flash`
by default, keeping LLM iteration off the Google embedding budget/quota).

Asserts the answer cites the expected page (by seitencode) and, for a
question whose answer is NOT in the manual, that the model is still honest
about that gap in the "Aus dem Werkstatthandbuch" section (rather than
inventing a manual citation that doesn't exist) while ALSO populating the
"Zusätzliches Wissen" section per the current system prompt - this is a
dev/test-only, non-agentic client (see gen_client.py's module doc), so it
only exercises the baseline prompt behavior, not the tool-calling agent
loop in src/agent.ts.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from google import genai
from google.genai import types

import embed_gemini as eg
import gen_client

RAG_DIR = Path(__file__).resolve().parent
REPO_ROOT = RAG_DIR.parents[1]
SEARCH_SCRIPT = RAG_DIR / "build" / "orama_search.mjs"

TOP_K = 8
SIMILARITY = 0.75

QUESTIONS = [
    {
        "label": "spec present in manual",
        "question": "Was ist das Anzugsdrehmoment für die Zündkerzen bei der Kompressionsprüfung (Seite 11-101)?",
        "expect_seitencode": "11-101",
        "expect_substrings": ["20 Nm", "11-101"],
        "expect_refusal": False,
    },
    {
        "label": "spec absent from a 1989 manual (honest-gap + extended-knowledge check)",
        "question": "Wie aktualisiere ich die Software des Navigationssystems über eine USB-Verbindung?",
        "expect_seitencode": None,
        # "nicht enthalten" - section 1 must stay honest about the manual gap
        # rather than inventing a citation; "Zusätzliches Wissen" - section 2
        # must still be populated per the current system prompt (this used to
        # assert a bare refusal only - see module doc above for why that
        # changed).
        "expect_substrings": ["nicht enthalten", "Zusätzliches Wissen"],
        "expect_refusal": False,
    },
]


def embed_query(client: genai.Client, query: str) -> list[float]:
    prefixed = f"task: search result | query: {query}"
    resp = client.models.embed_content(
        model=eg.EMBEDDING_MODEL,
        contents=[prefixed],
        config=types.EmbedContentConfig(output_dimensionality=3072),
    )
    return resp.embeddings[0].values


def orama_search(term: str, vector: list[float]) -> dict:
    payload = {"term": term, "vector": vector, "mode": "hybrid", "similarity": SIMILARITY, "limit": TOP_K}
    proc = subprocess.run(
        ["node", str(SEARCH_SCRIPT)], input=json.dumps(payload), capture_output=True, text=True, cwd=SEARCH_SCRIPT.parent
    )
    if proc.returncode != 0:
        sys.exit(f"ERROR: orama_search.mjs failed:\n{proc.stderr}")
    return json.loads(proc.stdout)


def expand_to_parent_notes(hits: list[dict]) -> list[dict]:
    """Dedup by notePath (unique key), read full note text directly from the vault."""
    seen = set()
    blocks = []
    for hit in hits:
        note_path = hit["notePath"]
        if note_path in seen:
            continue
        seen.add(note_path)
        full_path = REPO_ROOT / note_path
        if not full_path.exists():
            continue
        blocks.append(
            {
                "notePath": note_path,
                "seitencode": hit["seitencode"],
                "sektion": hit["sektion"],
                "text": full_path.read_text(encoding="utf-8"),
            }
        )
    return blocks


def build_context_xml(blocks: list[dict]) -> str:
    parts = [
        f'<document source="{b["notePath"]}" seitencode="{b["seitencode"]}" sektion="{b["sektion"]}">\n{b["text"]}\n</document>'
        for b in blocks
    ]
    return "<context>\n" + "\n\n".join(parts) + "\n</context>"


def main():
    api_key = eg.load_gemini_key()
    client = genai.Client(api_key=api_key)

    all_passed = True
    for spec in QUESTIONS:
        print(f"=== {spec['label']} ===")
        print(f"  question: {spec['question']!r}")

        vector = embed_query(client, spec["question"])
        result = orama_search(spec["question"], vector)
        blocks = expand_to_parent_notes(result["hits"])
        retrieved_codes = [b["seitencode"] for b in blocks]
        print(f"  retrieved seitencodes: {retrieved_codes}")

        context_xml = build_context_xml(blocks)
        gen = gen_client.generate(context_xml, spec["question"], provider="zen")
        answer = gen["text"]
        print(f"  answer:\n    {answer.replace(chr(10), chr(10) + '    ')}")
        if gen.get("usage"):
            print(f"  usage: {gen['usage']}")

        ok = True
        for substr in spec["expect_substrings"]:
            if substr not in answer:
                print(f"  [FAIL] expected substring not found: {substr!r}")
                ok = False
        if spec["expect_seitencode"] and spec["expect_seitencode"] not in retrieved_codes:
            print(f"  [FAIL] expected seitencode {spec['expect_seitencode']!r} not retrieved")
            ok = False

        print("  [PASS]" if ok else "  [FAIL]")
        all_passed = all_passed and ok
        print()

    print("=" * 60)
    print("ALL PASSED" if all_passed else "SOME CHECKS FAILED")
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
