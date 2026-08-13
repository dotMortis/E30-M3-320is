#!/usr/bin/env python3
"""
gen_client.py — gemini-3.6-flash caller for offline testing (Zen default,
Google switchable). See .pipeline/rag/PLAN.md Phase 4/5.

This is the Python-side test client used by test_generate.py; the real,
production chat path (with streaming) lives in the plugin's src/gemini.ts.
Kept deliberately non-streaming here (simpler for a smoke test) — streaming
behavior over the same endpoints is already verified live (see PLAN.md's
"Zen generation" note).

No temperature/top_p/top_k are ever sent - deprecated on gemini-3.6-flash;
determinism is steered by the system prompt alone.
"""

from __future__ import annotations

import sys
from pathlib import Path

import requests

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = REPO_ROOT / ".env"

GENERATION_MODEL = "gemini-3.6-flash"
ZEN_HOST = "https://opencode.ai/zen/v1/models"
GOOGLE_HOST = "https://generativelanguage.googleapis.com/v1beta/models"
BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# Pinned system instruction (see PLAN.md Phase 4 "System prompt", shipped verbatim).
# MUST stay byte-identical to src/gemini.ts's SYSTEM_PROMPT.
SYSTEM_PROMPT = """Du bist ein Experte für den BMW E30 M3 / 320is und assistierst bei Reparaturen.
Beantworte die Frage AUSSCHLIESSLICH anhand der Informationen im <context>.
- Fehlt eine genaue Teilenummer oder ein Spezifikationswert im Kontext, sage das
  ausdrücklich ("Diese Information ist im Kontext nicht enthalten.").
- Nutze KEIN Allgemeinwissen, außer der Nutzer verlangt es ausdrücklich.
- Nenne den Dateinamen (Seitencode) der Quelle bei technischen Angaben.
Antworte auf Deutsch."""


def load_key(name: str) -> str:
    key = None
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            if k.strip() == name:
                key = v.strip().strip('"').strip("'")
    import os

    key = key or os.environ.get(name)
    if not key:
        sys.exit(f"ERROR: {name} not found in .env or environment.")
    return key


def generate(context_xml: str, question: str, provider: str = "zen", model: str = GENERATION_MODEL) -> dict:
    """Returns {"text": str, "usage": dict|None}. Non-streaming (generateContent)."""
    if provider == "zen":
        key = load_key("OPENCODE_API_KEY")
        url = f"{ZEN_HOST}/{model}:generateContent"
        headers = {"x-goog-api-key": key, "Content-Type": "application/json", "User-Agent": BROWSER_UA}
    elif provider == "google":
        key = load_key("GEMINI_API_KEY")
        url = f"{GOOGLE_HOST}/{model}:generateContent"
        headers = {"x-goog-api-key": key, "Content-Type": "application/json"}
    else:
        raise ValueError(f"Unknown provider: {provider!r}")

    body = {
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": f"{context_xml}\n\n<question>\n{question}\n</question>"}]}],
    }
    resp = requests.post(url, headers=headers, json=body, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    usage = data.get("usageMetadata")
    return {"text": text, "usage": usage}
