#!/usr/bin/env python3
"""
Phase B.5 — Compute "related content" links between manual pages.

The generated vault (build_vault.py) gives every page note the same three-link
footer and nothing else: no note points at any *specific* related page. This
script derives those relations deterministically from data already extracted by
analyze.py (each page's begriffe EN->DE term list + transcription text) and
writes them back into manifest.json so the build stays reproducible:

  page["related"]           -> ordered list of related page_ids (capped)
  page["related_meta"]      -> {page_id: {"score": int, "shared": [terms],
                                          "cross": bool, "source": "heuristic"|"llm"}}
  page["mentioned_sections"]-> ordered list of section numbers explicitly
                               referenced in the ORIGINAL manual text

Method (see plan):
  1. Term-overlap heuristic over stoplist-filtered, mid-document-frequency terms.
       score>=3 -> auto-accept ; score==2 -> borderline (LLM review) ; else drop.
     Cross-section candidates get a ranking bonus. Capped at CAP per page.
  2. Borderline (score==2) pairs are reviewed by the same Zen model analyze.py
     uses (text-only, cached under cache/relations/, resumable). Only pairs the
     model confirms as genuinely related are kept.
  3. Explicit-reference parser: regex over transkription/beschreibung for BMW
     "Gruppe / Abschnitt / Kapitel NN" references -> target section MOC.

Usage:
  python3 scripts/relate.py --pilot                 # heuristic only, pilot sections
  python3 scripts/relate.py --pilot --review        # + LLM review of borderline
  python3 scripts/relate.py --pilot --review --dry-run
  python3 scripts/relate.py --estimate --pilot      # print borderline count / cost est
  python3 scripts/relate.py --all --review          # full vault
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

PIPE = Path(__file__).resolve().parent.parent          # .pipeline/
REPO = PIPE.parent
MANIFEST = PIPE / "manifest.json"
GLOSSARY = PIPE / "glossary.json"
ENV_FILE = REPO / ".env"
REL_CACHE = PIPE / "cache" / "relations"

# --- tuning -----------------------------------------------------------------
CAP = 4                       # max related pages rendered per note
DF_MIN, DF_MAX = 2, 8         # keep terms appearing in 2..8 pages (informative)
SCORE_ACCEPT = 3              # >= this shared-term count -> auto-accept
SCORE_BORDER = 2             # == this -> borderline, LLM-reviewed
CROSS_BONUS = 0.5            # ranking nudge so cross-section pairs sort first
MIN_TERM_LEN = 4

PILOT_SECTIONS = {"00 - Torque Specs", "21 - Clutch", "23 - Manual Transmission"}

# recurring manual boilerplate — appears as begriffe on many pages but carries
# no topical signal (page headers, generic doc chrome, maintenance-system words)
STOP = {
    "repair manual", "technical data", "service information", "specifications",
    "nominal values", "operating instructions", "important instructions",
    "important hints", "important notes", "general information",
    "bmw maintenance system", "operating-fluids file", "table of contents",
    "index", "introduction", "warning", "caution", "note", "notice",
    "front cover", "back cover", "maintenance system", "inspection",
    "pre-delivery inspection", "annual check", "engine oil service",
    "additional recommended service", "running-in inspection",
    "special tool", "tightening torque", "torque", "screw", "bolt", "washer",
    "nut", "plug", "seal", "cover", "type", "unit", "measure", "holder",
    "clamp", "pin", "circlip", "connector", "terminal", "ground",
    "zinc dust paint", "mating surfaces",
}

# --- Zen API (mirrors analyze.py) -------------------------------------------
ENDPOINT = "https://opencode.ai/zen/v1/responses"
MODEL = "gpt-5.6-luna"
USER_AGENT = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
             "(KHTML, like Gecko) Chrome/125.0 Safari/537.36")
PRICE_IN, PRICE_OUT = 0.20, 1.20


def sanitize(s: str) -> str:
    if not isinstance(s, str):
        return ""
    return re.sub(r"(?<=[A-Za-zÄÖÜäöüß])\x00(?=[A-Za-zÄÖÜäöüß])", "ü", s)


# ---------------------------------------------------------------- term model

def page_term_sets(pages: list[dict]) -> tuple[dict, dict]:
    """Return (page_id -> informative term set, term -> set(page_id))."""
    term_pages: dict[str, set] = defaultdict(set)
    raw: dict[str, set] = {}
    for p in pages:
        a = p.get("analysis") or {}
        terms = set()
        for b in (a.get("begriffe") or []):
            en = (b.get("en") or "").strip().lower()
            if len(en) >= MIN_TERM_LEN and en not in STOP:
                terms.add(en)
        raw[p["page_id"]] = terms
        for t in terms:
            term_pages[t].add(p["page_id"])
    return raw, term_pages


def informative_terms(term_pages: dict) -> set:
    return {t for t, s in term_pages.items() if DF_MIN <= len(s) <= DF_MAX}


# ---------------------------------------------------------------- explicit xref

# "Gruppe 34", "Abschnitt 11 12", "Kapitel 11-10", "Reparaturhandbuch-Gruppe 63"
_XREF_RE = re.compile(
    r"(?:Reparaturhandbuch[- ]?)?(?:Gruppe|Abschnitt|Kapitel|Motorbereich|Untergruppe)\s*"
    r"(\d{2})(?:[\s\u2013\-]?\d{1,3})?",
    re.IGNORECASE,
)


def mentioned_sections(page: dict, valid_nos: set) -> list[str]:
    a = page.get("analysis") or {}
    text = sanitize(a.get("transkription") or "") + "\n" + sanitize(a.get("beschreibung") or "")
    own = str(page.get("section_no") or "")
    found: list[str] = []
    for m in _XREF_RE.finditer(text):
        no = m.group(1)
        if no in valid_nos and no != own and no not in found:
            found.append(no)
    return found


# ---------------------------------------------------------------- heuristic

def score_candidates(pages: list[dict], scope_ids: set,
                     raw: dict, term_pages: dict, info: set):
    """For each page in scope, rank other pages by shared informative terms.

    Returns:
      accepted[pid]  -> list of (other_id, score, shared_terms, cross) score>=ACCEPT
      borderline     -> set of frozenset({a,b}) unordered pairs with score==BORDER
      shared_of      -> {(a,b): shared_terms} for all considered pairs (a<b)
    """
    by_id = {p["page_id"]: p for p in pages}
    accepted: dict[str, list] = {}
    borderline: set = set()
    shared_of: dict = {}

    for p in pages:
        pid = p["page_id"]
        if pid not in scope_ids:
            continue
        my_terms = raw[pid] & info
        cand: dict[str, set] = defaultdict(set)
        for t in my_terms:
            for other in term_pages[t]:
                if other != pid:
                    cand[other].add(t)
        ranked = []
        for other, shared in cand.items():
            score = len(shared)
            if score < SCORE_BORDER:
                continue
            cross = by_id[other]["section_folder"] != p["section_folder"]
            key = tuple(sorted((pid, other)))
            shared_of[key] = sorted(shared)
            if score == SCORE_BORDER:
                borderline.add(frozenset((pid, other)))
            ranked.append((other, score, sorted(shared), cross))
        # sort: higher score first, cross-section bonus, then stable by id
        ranked.sort(key=lambda r: (-(r[1] + (CROSS_BONUS if r[3] else 0)), r[0]))
        accepted[pid] = ranked
    return accepted, borderline, shared_of


# ---------------------------------------------------------------- LLM review

def load_key() -> str:
    key = None
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            if k.strip() == "OPENCODE_API_KEY":
                key = v.strip().strip('"').strip("'")
    import os
    key = key or os.environ.get("OPENCODE_API_KEY")
    if not key:
        sys.exit("ERROR: OPENCODE_API_KEY not found in .env or environment.")
    return key


def pair_cache_path(a: str, b: str) -> Path:
    x, y = sorted((a, b))
    safe = re.sub(r"[^A-Za-z0-9_.-]", "_", f"{x}__VS__{y}")
    return REL_CACHE / f"{safe}.json"


def snippet(page: dict, n: int = 320) -> str:
    a = page.get("analysis") or {}
    d = sanitize(a.get("beschreibung") or "").strip()
    return d[:n]


REVIEW_PROMPT = (
    "Du bewertest, ob zwei Seiten eines BMW-Werkstatthandbuchs (E30 M3 / 320is) "
    "thematisch verwandt sind, sodass ein Querverweis dem Leser hilft. "
    "Verwandt = gleiche Baugruppe/gleiches Bauteil oder ein direkter Arbeits-/"
    "Funktionszusammenhang (z. B. Anziehdrehmoment-Tabelle zur passenden "
    "Ein-/Ausbauanleitung). NICHT verwandt = nur zufällig gemeinsame Allgemein-"
    "begriffe.\n\n"
    "Antworte AUSSCHLIESSLICH als eine JSON-Liste. Jedes Element:\n"
    '  {"id": <lfd. Nummer>, "related": true|false, "grund": "<kurz, deutsch>"}\n'
)


def build_review_body(batch: list[dict]) -> bytes:
    lines = [REVIEW_PROMPT, "", "Paare:"]
    for item in batch:
        lines.append(
            f'\n[{item["id"]}] gemeinsame Begriffe: {", ".join(item["shared"])}'
            f'\n  A ({item["a_code"]}): {item["a_title"]}\n     {item["a_snip"]}'
            f'\n  B ({item["b_code"]}): {item["b_title"]}\n     {item["b_snip"]}'
        )
    payload = {
        "model": MODEL,
        "input": [{"role": "user", "content": [
            {"type": "input_text", "text": "\n".join(lines)}]}],
    }
    return json.dumps(payload).encode("utf-8")


def call_api(key: str, body: bytes, timeout: int = 120, retries: int = 4) -> dict:
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json",
               "User-Agent": USER_AGENT}
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(ENDPOINT, data=body, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}: {e.read().decode('utf-8','replace')[:200]}"
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(min(2 ** attempt, 30)); continue
            raise RuntimeError(last)
        except (urllib.error.URLError, TimeoutError) as e:
            last = str(e); time.sleep(min(2 ** attempt, 30))
    raise RuntimeError(f"exhausted retries: {last}")


def extract_text(resp: dict) -> str:
    for item in reversed(resp.get("output") or []):
        if item.get("type") == "message":
            for c in item.get("content", []):
                if c.get("type") in ("output_text", "text") and c.get("text"):
                    return c["text"]
    if resp.get("output_text"):
        return resp["output_text"]
    return ""


def parse_json_list(text: str):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\[.*\]", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                return None
    return None


def review_pairs(pairs: list[tuple], by_id: dict, shared_of: dict,
                 estimate_only: bool, batch_size: int = 12) -> dict:
    """Return {frozenset(pair): bool}. Cached per pair; resumable."""
    REL_CACHE.mkdir(parents=True, exist_ok=True)
    verdict: dict = {}
    todo = []
    for a, b in pairs:
        cp = pair_cache_path(a, b)
        if cp.exists():
            try:
                verdict[frozenset((a, b))] = json.loads(cp.read_text())["related"]
                continue
            except Exception:
                pass
        todo.append((a, b))

    print(f"  borderline pairs      : {len(pairs)}")
    print(f"  already cached        : {len(pairs) - len(todo)}")
    print(f"  to review (this run)  : {len(todo)}")
    if estimate_only:
        # rough: ~230 in-tok + ~40 out-tok per pair (text only)
        est = (len(todo) * 230 / 1e6 * PRICE_IN) + (len(todo) * 40 / 1e6 * PRICE_OUT)
        print(f"  ESTIMATED cost        : ${est:.4f} (text-only, {batch_size}/call)")
        return verdict
    if not todo:
        return verdict

    key = load_key()
    for i in range(0, len(todo), batch_size):
        chunk = todo[i:i + batch_size]
        batch = []
        for j, (a, b) in enumerate(chunk):
            pa, pb = by_id[a], by_id[b]
            batch.append({
                "id": j, "a": a, "b": b,
                "shared": shared_of.get(tuple(sorted((a, b))), []),
                "a_code": re.sub(r"\.jpg$", "", pa["image_file"]),
                "b_code": re.sub(r"\.jpg$", "", pb["image_file"]),
                "a_title": sanitize(pa.get("titel_de") or ""),
                "b_title": sanitize(pb.get("titel_de") or ""),
                "a_snip": snippet(pa), "b_snip": snippet(pb),
            })
        try:
            resp = call_api(key, build_review_body(batch))
            parsed = parse_json_list(extract_text(resp)) or []
        except Exception as e:
            print(f"  batch {i//batch_size} FAILED: {e}")
            parsed = []
        by_num = {int(d["id"]): bool(d.get("related")) for d in parsed
                  if isinstance(d, dict) and "id" in d}
        for item in batch:
            rel = by_num.get(item["id"], False)
            verdict[frozenset((item["a"], item["b"]))] = rel
            pair_cache_path(item["a"], item["b"]).write_text(
                json.dumps({"a": item["a"], "b": item["b"], "related": rel,
                            "shared": item["shared"]}, ensure_ascii=False, indent=2),
                encoding="utf-8")
        print(f"  reviewed {min(i+batch_size,len(todo))}/{len(todo)}")
    return verdict


# ---------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pilot", action="store_true", help="restrict scope to pilot sections")
    ap.add_argument("--all", action="store_true", help="whole vault")
    ap.add_argument("--review", action="store_true", help="LLM-review borderline pairs")
    ap.add_argument("--estimate", action="store_true", help="print borderline count/cost, no API calls")
    ap.add_argument("--dry-run", action="store_true", help="do not write manifest.json")
    args = ap.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    glossary = json.loads(GLOSSARY.read_text(encoding="utf-8"))
    pages = manifest["pages"]
    by_id = {p["page_id"]: p for p in pages}
    valid_nos = {v["no"] for v in glossary["sections"].values() if v.get("no")}

    if args.all:
        scope = {p["page_id"] for p in pages}
    else:
        scope = {p["page_id"] for p in pages if p["section_folder"] in PILOT_SECTIONS}
    print(f"scope pages: {len(scope)} (pilot={not args.all})")

    raw, term_pages = page_term_sets(pages)
    info = informative_terms(term_pages)
    print(f"informative terms (df {DF_MIN}..{DF_MAX}): {len(info)}")

    accepted, borderline, shared_of = score_candidates(pages, scope, raw, term_pages, info)

    # borderline pairs whose *either* endpoint is in scope (so we can render it)
    border_pairs = sorted(
        {tuple(sorted(fs)) for fs in borderline
         if (set(fs) & scope)},
        key=lambda x: x)

    verdict: dict = {}
    if args.review or args.estimate:
        print("LLM review:")
        verdict = review_pairs(border_pairs, by_id, shared_of,
                               estimate_only=args.estimate)
        if args.estimate:
            return 0

    # assemble final relations per scoped page
    n_rel = n_ment = 0
    for pid in scope:
        p = by_id[pid]
        ranked = accepted.get(pid, [])
        final = []
        meta = {}
        for other, score, shared, cross in ranked:
            if score >= SCORE_ACCEPT:
                keep, source = True, "heuristic"
            else:  # borderline
                keep = verdict.get(frozenset((pid, other)), False) if (args.review) else False
                source = "llm"
            if not keep:
                continue
            final.append(other)
            meta[other] = {"score": score, "shared": shared, "cross": cross, "source": source}
            if len(final) >= CAP:
                break
        p["related"] = final
        p["related_meta"] = meta
        ms = mentioned_sections(p, valid_nos)
        p["mentioned_sections"] = ms
        n_rel += len(final)
        n_ment += len(ms)

    print(f"pages scoped         : {len(scope)}")
    print(f"related links total  : {n_rel}")
    print(f"mentioned-sec total  : {n_ment}")

    if args.dry_run:
        print("dry-run: manifest.json NOT written")
        # show a few examples
        for pid in list(scope)[:8]:
            p = by_id[pid]
            if p.get("related"):
                print(f"  {pid} -> {p['related']}")
        return 0

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"manifest.json updated ({MANIFEST})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
