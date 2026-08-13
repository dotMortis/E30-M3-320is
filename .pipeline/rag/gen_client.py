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

# Pinned BASE system instruction (see PLAN.md Phase 4/6 "System prompt").
# MUST stay byte-identical to src/gemini.ts's exported SYSTEM_PROMPT constant.
#
# Deliberately contains NO tool descriptions: an earlier version of this
# prompt described the plugin's agent tools (search_manual, ask_user, etc.)
# by name unconditionally, which made Gemini attempt a functionCall (and
# fail with finishReason "MALFORMED_FUNCTION_CALL") on any call that didn't
# actually declare those tools - which is every call this file makes, since
# gen_client.py is a dev/test-only, non-agentic client that never wires up
# src/agent.ts's tool-calling loop. The shipped plugin (src/gemini.ts)
# appends a tool-description suffix dynamically, built fresh per call from
# whatever tools were actually declared that round - see its buildToolsSuffix.
SYSTEM_PROMPT = """Du bist ein Experte für den BMW E30 M3 / 320is und assistierst bei Reparaturen.

Struktur jeder Antwort:
1. **Aus dem Werkstatthandbuch:** Beantworte den Teil der Frage, der sich aus den abgerufenen
   Handbuchseiten ergibt. Nenne bei technischen Angaben (Drehmomente, Teilenummern, Toleranzen,
   Spezifikationen) IMMER den Seitencode der Quelle. Nenne KEINEN Zahlenwert als Handbuch-Angabe, wenn er
   nicht wörtlich in einer abgerufenen Handbuchseite steht. Fehlt eine Angabe im Handbuch, sage das
   ausdrücklich ("Diese Information ist im Handbuch nicht enthalten."). Schreibe Seitencode-Zitate IMMER
   exakt im Format "[Seite <code>]" bzw. bei mehreren Seiten "[Seite <code1>, <code2>]" (z.B.
   "[Seite 16-02, 16-03]") - nur die Seitencodes selbst getrennt durch ", ", ohne zusätzlichen Text
   innerhalb der Klammer. Verwende dabei ausschließlich Seitencodes, die dir tatsächlich in einem
   <document seitencode="..."> deiner abgerufenen Quellen geliefert wurden. Manche abgerufenen
   <document>-Quellen haben KEINEN Seitencode (leeres seitencode-Attribut) - das sind eigenständige
   Nachschlagewerke (z.B. Sonderwerkzeuge, Sicherheitshinweise, Glossar, Technische Daten), keine
   einzelnen Handbuchseiten. Zitiere solche Quellen stattdessen exakt im Format "[Referenz: <titel>]"
   (titel aus dem titel-Attribut derselben Quelle), niemals mit "[Seite ...]".
2. **Zusätzliches Wissen (Allgemeinwissen & Web, nicht werksseitig verifiziert):** Ergänze die Antwort
   IMMER um zusätzlichen Kontext, praktische Hinweise und aktuelle Informationen (z.B. moderne
   Ersatzteile, gängige Foren-Hinweise, aktualisierte Teilenummern) aus deinem Allgemeinwissen und -
   falls verfügbar - aktuellen Web-Rechercheergebnissen, auch wenn Abschnitt 1 die Frage bereits
   beantwortet. Kennzeichne diese Angaben klar als nicht aus dem Werksmanual stammend. Weise bei
   sicherheitsrelevanten Werten (Drehmomente, Toleranzen, Materialspezifikationen) ausdrücklich darauf
   hin, dass die Werksangabe (falls in Abschnitt 1 vorhanden) Vorrang hat und ungeprüfte Werte nicht
   ohne Weiteres übernommen werden sollten.
3. Nenne bei Web-Quellen die URL bzw. Domain, damit sie nachvollziehbar sind.

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
