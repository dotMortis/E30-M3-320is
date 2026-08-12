#!/usr/bin/env python3
"""
Phase A — Generate a concise German title (titel_de) for every page.

Text-only pass over the Zen Responses API: given the English caption + the
German Beschreibung, return a short (3-8 word) German title suitable for a
filename. Ditto-mark captions ("), blanks and continuations are handled
naturally because the model also sees the description.

Resumable + budget-capped, same design as analyze.py. Writes each title to
cache/titles/<page_id>.json and merges titel_de into manifest.json.

Usage:
  python3 make_titles.py --pilot 15
  python3 make_titles.py --budget 1.00
  python3 make_titles.py --merge
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import json
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path

PIPE = Path(__file__).resolve().parent.parent
REPO = PIPE.parent
MANIFEST = PIPE / "manifest.json"
CACHE_DIR = PIPE / "cache" / "titles"
COST_LOG = PIPE / "cache" / "titles_cost_log.json"
ENV_FILE = REPO / ".env"

ENDPOINT = "https://opencode.ai/zen/v1/responses"
MODEL = "gpt-5.6-luna"
USER_AGENT = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/125.0 Safari/537.36")
PRICE_IN = 0.20
PRICE_OUT = 1.20
WORST_CASE_PAGE = 0.0008  # titles are tiny

_lock = threading.Lock()


def log(m): 
    with _lock:
        print(m, flush=True)


def load_env() -> str:
    import os
    key = None
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                if k.strip() == "OPENCODE_API_KEY":
                    key = v.strip().strip('"').strip("'")
    key = key or os.environ.get("OPENCODE_API_KEY")
    if not key:
        sys.exit("ERROR: OPENCODE_API_KEY not found.")
    return key


PROMPT = (
    "Du bist technischer Redakteur fuer BMW-Werkstatthandbuecher. "
    "Erzeuge einen praegnanten deutschen TITEL fuer eine Handbuchseite, geeignet als Dateiname.\n"
    "Regeln:\n"
    "- 3 bis 8 Woerter, Substantivstil, keine Anfuehrungszeichen, kein Punkt am Ende.\n"
    "- Etablierte deutsche BMW-Werkstattterminologie.\n"
    "- Keine Seitennummer, kein Kapitel, keine Sonderzeichen ausser Bindestrich.\n"
    "- Wenn es eine Arbeitsanweisung ist, Infinitivstil am Ende, z. B. 'aus- und einbauen'.\n"
    "Antworte AUSSCHLIESSLICH als JSON: {\"titel\": \"...\"}"
)


def build_body(page: dict) -> bytes:
    cap = page.get("caption_en") or ""
    a = page.get("analysis") or {}
    besch = (a.get("beschreibung") or "")[:600]
    typ = a.get("seitentyp") or ""
    ctx = (
        f"Englischer Bildtitel (kann '\"' = wie oben, leer oder unvollstaendig sein): \"{cap}\"\n"
        f"Seitentyp: {typ}\n"
        f"Deutsche Beschreibung: {besch}"
    )
    payload = {
        "model": MODEL,
        "input": [{"role": "user", "content": [{"type": "input_text", "text": PROMPT + "\n\n" + ctx}]}],
    }
    return json.dumps(payload).encode("utf-8")


def extract_text(resp: dict) -> str:
    out = resp.get("output") or []
    for item in reversed(out):
        if item.get("type") == "message":
            for c in item.get("content", []):
                if c.get("type") in ("output_text", "text") and c.get("text"):
                    return c["text"]
    return resp.get("output_text") or ""


def parse_title(text: str) -> str | None:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text).strip()
    try:
        d = json.loads(text)
        t = (d.get("titel") or "").strip()
        return t or None
    except json.JSONDecodeError:
        m = re.search(r'"titel"\s*:\s*"([^"]+)"', text)
        if m:
            return m.group(1).strip()
    return None


def call_api(key: str, body: bytes, timeout=60, retries=4) -> dict:
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json",
               "User-Agent": USER_AGENT}
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(ENDPOINT, data=body, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            code = e.code
            last = f"HTTP {code}: {e.read().decode('utf-8','replace')[:150]}"
            if code in (429, 500, 502, 503, 504):
                time.sleep(min(2**i, 20)); continue
            raise RuntimeError(last)
        except (urllib.error.URLError, TimeoutError) as e:
            last = str(e); time.sleep(min(2**i, 20))
    raise RuntimeError(f"retries exhausted: {last}")


def page_cost(u: dict) -> float:
    return (u.get("input_tokens", 0) or 0)/1e6*PRICE_IN + (u.get("output_tokens", 0) or 0)/1e6*PRICE_OUT


def cpath(pid): return CACHE_DIR / f"{pid}.json"


def prior_total() -> float:
    t = 0.0
    for f in CACHE_DIR.glob("*.json"):
        try:
            t += float(json.loads(f.read_text())["cost"])
        except Exception:
            pass
    return t


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--budget", type=float, default=1.00)
    ap.add_argument("--pilot", type=int, default=0)
    ap.add_argument("--concurrency", type=int, default=6)
    ap.add_argument("--merge", action="store_true")
    args = ap.parse_args()

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    if args.merge:
        n = 0
        for p in manifest["pages"]:
            cp = cpath(p["page_id"])
            if cp.exists():
                d = json.loads(cp.read_text())
                if d.get("titel"):
                    p["titel_de"] = d["titel"]; n += 1
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        log(f"Merged {n} titles into manifest.json")
        return 0

    key = load_env()
    pages = manifest["pages"]
    todo = [p for p in pages if not cpath(p["page_id"]).exists()]
    if args.pilot:
        todo = todo[:args.pilot]

    running = prior_total()
    log(f"pages={len(pages)} pending={len(todo)} prior_spend=${running:.4f} cap=${args.budget:.2f}")

    stop = threading.Event()
    ctr = {"ok": 0, "fail": 0, "in": 0, "out": 0}
    tlock = threading.Lock()

    def worker(p):
        nonlocal running
        if stop.is_set():
            return
        with tlock:
            if running + WORST_CASE_PAGE > args.budget:
                if not stop.is_set():
                    stop.set(); log(f"\nBUDGET GATE at ${running:.4f}; stopping cleanly (resumable).")
                return
        try:
            resp = call_api(key, build_body(p))
        except Exception as e:
            ctr["fail"] += 1; log(f"  FAIL {p['page_id']}: {e}"); return
        title = parse_title(extract_text(resp))
        u = resp.get("usage", {}) or {}
        cost = page_cost(u)
        cpath(p["page_id"]).write_text(json.dumps(
            {"page_id": p["page_id"], "titel": title, "usage": u, "cost": cost, "ok": bool(title)},
            ensure_ascii=False, indent=2), encoding="utf-8")
        with tlock:
            running += cost
            ctr["ok" if title else "fail"] += 1
            ctr["in"] += u.get("input_tokens", 0) or 0
            ctr["out"] += u.get("output_tokens", 0) or 0
            done = ctr["ok"] + ctr["fail"]
            log(f"  [{done}/{len(todo)}] {p['page_id']}: {title!r} ${cost:.5f} cum=${running:.4f}")

    with cf.ThreadPoolExecutor(max_workers=args.concurrency) as ex:
        list(cf.as_completed([ex.submit(worker, p) for p in todo]))

    COST_LOG.write_text(json.dumps({
        "cumulative_cost": running, "ok": ctr["ok"], "fail": ctr["fail"],
        "in_tokens": ctr["in"], "out_tokens": ctr["out"],
        "stopped_on_budget": stop.is_set(), "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    log(f"\nSUMMARY ok={ctr['ok']} fail={ctr['fail']} spend=${running:.4f}/${args.budget:.2f}")
    if stop.is_set():
        log("stopped on budget — rerun to continue.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
