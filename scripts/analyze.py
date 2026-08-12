#!/usr/bin/env python3
"""
Phase 2 — Vision analysis of every manual page via GPT 5.6 Luna (OpenCode Zen).

For each image in manifest.json this sends the scan + EN caption to the Zen
Responses API and requests structured German JSON:
    beschreibung, transkription, begriffe (EN->DE pairs), seitentyp, konfidenz

Key mechanics (verified against the live Zen gateway):
  * Endpoint : https://opencode.ai/zen/v1/responses   (NOT /chat/completions)
  * Model    : gpt-5.6-luna  (bare id, no "opencode/" prefix)
  * Content  : [{type:input_text,...},{type:input_image, image_url:"data:...base64,.."}]
  * Text out : output[-1].content[0].text   (top-level output_text is null)
  * Usage    : usage.input_tokens / usage.output_tokens
  * Cloudflare requires a browser-like User-Agent header.

Safety / spend:
  * Resume  : each result cached at cache/<page_id>.json; completed pages skipped.
  * Budget  : pre-call gate. If running_total + worst_case_page_est > budget,
              stop cleanly WITHOUT sending. Default cap $3.00 (--budget).
  * Cost log: cache/cost_log.json accumulates per-page + cumulative spend and is
              rebuilt from cached results on restart (survives interruptions).

Usage:
  python3 scripts/analyze.py --pilot 10      # analyze 10 varied pages
  python3 scripts/analyze.py                 # analyze all remaining pages
  python3 scripts/analyze.py --budget 3.00   # adjust hard cap
  python3 scripts/analyze.py --merge         # merge cache back into manifest.json
"""

from __future__ import annotations

import argparse
import base64
import concurrent.futures as cf
import json
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MANIFEST = REPO / "manifest.json"
CACHE_DIR = REPO / "cache"
COST_LOG = CACHE_DIR / "cost_log.json"
ENV_FILE = REPO / ".env"

ENDPOINT = "https://opencode.ai/zen/v1/responses"
MODEL = "gpt-5.6-luna"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Safari/537.36"
)

# Luna pricing ($/1M tokens)
PRICE_IN = 0.20
PRICE_OUT = 1.20
# worst-case single-page cost estimate used by the pre-call budget gate
WORST_CASE_PAGE = 0.0025

PROMPT = (
    "Du bist ein KFZ-Fachuebersetzer und technischer Redakteur fuer originale "
    "BMW Werkstatthandbuecher (E30 M3 / 320is, Baujahr ~1989). Analysiere die "
    "beigefuegte gescannte Handbuchseite grundlich.\n\n"
    "Gib die Antwort AUSSCHLIESSLICH als eine einzige gueltige JSON-Struktur "
    "zurueck (keine Markdown-Codeblöcke, kein Text davor oder danach) mit exakt "
    "diesen Schluesseln:\n"
    '  "beschreibung": string  – ein praeziser deutscher Absatz, der erklaert, '
    "was die Seite zeigt und wozu sie dient.\n"
    '  "transkription": string – die sichtbaren Beschriftungen, Arbeitsschritte, '
    "Warnhinweise und Tabellenwerte, ins Deutsche uebertragen. Verwende \\n fuer "
    "Zeilenumbrueche. Leerer String, wenn nichts Lesbares vorhanden ist.\n"
    '  "begriffe": array      – Liste von Objekten {"en": <englischer Fachbegriff>, '
    '"de": <deutsche Entsprechung>} fuer die wichtigsten Bauteil-/Fachbegriffe der Seite.\n'
    '  "seitentyp": string    – genau einer von: "diagram", "table", "text".\n'
    '  "konfidenz": number    – 0.0 bis 1.0, wie sicher die Analyse ist.\n\n'
    "Sei technisch korrekt und benutze etablierte deutsche BMW-Werkstattterminologie."
)

_print_lock = threading.Lock()


def log(msg: str) -> None:
    with _print_lock:
        print(msg, flush=True)


def load_env() -> str:
    key = None
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            if k.strip() == "OPENCODE_API_KEY":
                key = v.strip().strip('"').strip("'")
    import os
    key = key or os.environ.get("OPENCODE_API_KEY")
    if not key:
        sys.exit("ERROR: OPENCODE_API_KEY not found in .env or environment.")
    return key


def load_manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def image_data_url(path: Path) -> str:
    raw = path.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:image/jpeg;base64,{b64}"


def build_body(page: dict, data_url: str) -> bytes:
    caption = page.get("caption_en") or ""
    hint = f"\n\nEnglischer Bildtitel aus dem Index (Kontext): \"{caption}\"" if caption else ""
    payload = {
        "model": MODEL,
        "input": [
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": PROMPT + hint},
                    {"type": "input_image", "image_url": data_url},
                ],
            }
        ],
    }
    return json.dumps(payload).encode("utf-8")


def extract_text(resp: dict) -> str:
    # prefer the last message-type output item
    out = resp.get("output") or []
    for item in reversed(out):
        if item.get("type") == "message":
            for c in item.get("content", []):
                if c.get("type") in ("output_text", "text") and c.get("text"):
                    return c["text"]
    # fallbacks
    if resp.get("output_text"):
        return resp["output_text"]
    for item in reversed(out):
        for c in item.get("content", []) or []:
            if c.get("text"):
                return c["text"]
    return ""


def parse_json_lenient(text: str) -> dict | None:
    text = text.strip()
    # strip accidental code fences
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # grab the outermost {...}
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            return None
    return None


def call_api(key: str, body: bytes, timeout: int = 120, retries: int = 4) -> dict:
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
    }
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(ENDPOINT, data=body, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            code = e.code
            detail = e.read().decode("utf-8", "replace")[:200]
            last_err = f"HTTP {code}: {detail}"
            if code in (429, 500, 502, 503, 504):
                time.sleep(min(2 ** attempt, 30))
                continue
            raise RuntimeError(last_err)
        except (urllib.error.URLError, TimeoutError) as e:
            last_err = str(e)
            time.sleep(min(2 ** attempt, 30))
    raise RuntimeError(f"exhausted retries: {last_err}")


def page_cost(usage: dict) -> float:
    it = usage.get("input_tokens", 0) or 0
    ot = usage.get("output_tokens", 0) or 0
    return it / 1e6 * PRICE_IN + ot / 1e6 * PRICE_OUT


def cache_path(page_id: str) -> Path:
    return CACHE_DIR / f"{page_id}.json"


def rebuild_cost_total() -> float:
    """Sum spend from all cached results (survives restarts)."""
    total = 0.0
    for f in CACHE_DIR.glob("*.json"):
        if f.name == "cost_log.json":
            continue
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
            total += float(d.get("cost", 0.0))
        except Exception:
            continue
    return total


def select_pages(manifest: dict, pilot: int | None) -> list[dict]:
    pages = manifest["pages"]
    pending = [p for p in pages if not cache_path(p["page_id"]).exists()]
    if pilot:
        # varied sample: spread across sections, mix captioned/uncaptioned
        by_section: dict[str, list] = {}
        for p in pending:
            by_section.setdefault(p["section_folder"], []).append(p)
        picked, i = [], 0
        sections = list(by_section.values())
        while len(picked) < pilot and sections:
            for bucket in sections:
                if i < len(bucket):
                    picked.append(bucket[i])
                    if len(picked) >= pilot:
                        break
            i += 1
            if i > 200:
                break
        return picked[:pilot]
    return pending


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--budget", type=float, default=3.00, help="hard USD spend cap (default 3.00)")
    ap.add_argument("--pilot", type=int, default=0, help="analyze only N varied pages")
    ap.add_argument("--concurrency", type=int, default=4)
    ap.add_argument("--merge", action="store_true", help="merge cache into manifest.json and exit")
    args = ap.parse_args()

    CACHE_DIR.mkdir(exist_ok=True)
    manifest = load_manifest()

    if args.merge:
        merged = merge_into_manifest(manifest)
        log(f"Merged {merged} analyses into {MANIFEST.name}")
        return 0

    key = load_env()
    pilot = args.pilot or None
    todo = select_pages(manifest, pilot)

    running_total = rebuild_cost_total()
    already = sum(1 for p in manifest["pages"] if cache_path(p["page_id"]).exists())
    log(f"Pages total={len(manifest['pages'])} done={already} pending(this run)={len(todo)}")
    log(f"Prior spend from cache: ${running_total:.4f} | budget cap: ${args.budget:.2f}")

    total_lock = threading.Lock()
    stop_flag = threading.Event()
    counters = {"ok": 0, "fail": 0, "in_tok": 0, "out_tok": 0}

    def worker(page: dict):
        nonlocal running_total
        if stop_flag.is_set():
            return
        # pre-call budget gate
        with total_lock:
            if running_total + WORST_CASE_PAGE > args.budget:
                if not stop_flag.is_set():
                    stop_flag.set()
                    log(f"\nBUDGET GATE: ${running_total:.4f} + worst-case "
                        f"${WORST_CASE_PAGE:.4f} would exceed cap ${args.budget:.2f}. "
                        f"Stopping cleanly (resumable).")
                return

        img = REPO / page["image_path"]
        try:
            body = build_body(page, image_data_url(img))
            resp = call_api(key, body)
        except Exception as e:
            counters["fail"] += 1
            log(f"  FAIL {page['page_id']}: {e}")
            return

        text = extract_text(resp)
        parsed = parse_json_lenient(text)
        usage = resp.get("usage", {}) or {}
        cost = page_cost(usage)

        result = {
            "page_id": page["page_id"],
            "image_path": page["image_path"],
            "model": MODEL,
            "usage": usage,
            "cost": cost,
            "ok": parsed is not None,
            "analysis": parsed,
            "raw_text": None if parsed is not None else text[:2000],
        }
        cache_path(page["page_id"]).write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        with total_lock:
            running_total += cost
            counters["ok" if parsed is not None else "fail"] += 1
            counters["in_tok"] += usage.get("input_tokens", 0) or 0
            counters["out_tok"] += usage.get("output_tokens", 0) or 0
            done_now = counters["ok"] + counters["fail"]
            status = "ok" if parsed is not None else "no-json"
            log(f"  [{done_now}/{len(todo)}] {page['page_id']} "
                f"{status} in={usage.get('input_tokens',0)} out={usage.get('output_tokens',0)} "
                f"${cost:.4f} cum=${running_total:.4f}")

    with cf.ThreadPoolExecutor(max_workers=args.concurrency) as ex:
        futures = [ex.submit(worker, p) for p in todo]
        for _ in cf.as_completed(futures):
            pass

    # persist cost log summary
    summary = {
        "budget_cap": args.budget,
        "cumulative_cost": running_total,
        "run_ok": counters["ok"],
        "run_fail": counters["fail"],
        "run_input_tokens": counters["in_tok"],
        "run_output_tokens": counters["out_tok"],
        "pages_cached_total": sum(1 for p in manifest["pages"] if cache_path(p["page_id"]).exists()),
        "pages_total": len(manifest["pages"]),
        "stopped_on_budget": stop_flag.is_set(),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    COST_LOG.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    log("\n=== RUN SUMMARY ===")
    log(f"  succeeded : {counters['ok']}")
    log(f"  failed    : {counters['fail']}")
    log(f"  tokens    : in={counters['in_tok']} out={counters['out_tok']}")
    log(f"  spend     : ${running_total:.4f} / cap ${args.budget:.2f}")
    log(f"  cached    : {summary['pages_cached_total']}/{summary['pages_total']} pages")
    if stop_flag.is_set():
        log("  NOTE: stopped on budget cap — rerun (optionally raise --budget) to continue.")
    return 0


def merge_into_manifest(manifest: dict) -> int:
    count = 0
    for p in manifest["pages"]:
        cp = cache_path(p["page_id"])
        if cp.exists():
            try:
                d = json.loads(cp.read_text(encoding="utf-8"))
                if d.get("analysis") is not None:
                    p["analysis"] = d["analysis"]
                    count += 1
            except Exception:
                continue
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return count


if __name__ == "__main__":
    sys.exit(main())
