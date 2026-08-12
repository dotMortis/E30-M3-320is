#!/usr/bin/env python3
"""Phase 9 (post-hoc) — Cross-link torque-spec tables to the procedure pages
that actually need them.

relate.py's generic term-overlap heuristic almost never links a torque table
to its matching procedure page: it requires shared terms with document
frequency 2..8 across the WHOLE vault, but torque-table component nouns
("Hauptlagerschrauben", "Zylinderkopfschrauben", ...) are often unique to a
single torque page and a single procedure page (df=1 on each side), so they
never pass the informative-term filter. relate.py also stop-lists generic
fastener/torque vocabulary outright to avoid noise -- correct for its
purpose, but it means torque<->procedure pairs get essentially zero signal
from that mechanism (confirmed empirically: torque-spec related-link
coverage was unchanged after fixing section_no).

This script is a dedicated, narrower pass: it only ever compares a torque
page against procedure pages in the SAME BMW group (page["section_no"],
fixed by fix_reference_sections.py), which is already strong evidence of
relevance, then scores by shared term overlap (no df restriction here) plus
significant-word overlap between the two titles. Writes two new manifest
fields (rendered as a dedicated "Anzugsdrehmomente" block by build_vault.py,
separate from the generic "Verwandte Seiten"):

  torque_page["procedure_refs"]   -> ordered list of matching procedure page_ids
  procedure_page["torque_refs"]   -> ordered list of matching torque page_ids

Re-runnable / idempotent; writes manifest.json in place.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

PIPE = Path(__file__).resolve().parent.parent
MANIFEST = PIPE / "manifest.json"

TORQUE_FOLDER = "00 - Torque Specs"
EXCLUDE_FOLDERS = {TORQUE_FOLDER, "1990 BMW M3 Electrical Troubleshooting Manual"}

CAP_PER_TORQUE = 6      # a torque table may serve several related procedures
CAP_PER_PROCEDURE = 4   # a procedure may need several torque tables
MIN_SCORE = 2           # >=1 shared term, or >=2 title-word hits, or a mix

# Generic fastener/doc vocabulary that carries no component-identifying signal
# (mirrors relate.py's STOP list; torque-specific terms like "torque"/"screw"
# would otherwise dominate every match).
STOP_TERMS = {
    "engine", "type", "screw", "bolt", "bolts", "washer", "nut", "plug",
    "seal", "cover", "unit", "measure", "holder", "clamp", "pin", "circlip",
    "connector", "terminal", "ground", "torque", "torque angle", "torsion angle",
    "value", "table of contents", "index", "introduction", "warning", "caution",
    "note", "notice", "front cover", "back cover", "special tool",
    "tightening torque", "coating", "replace", "settling time", "warm-running time",
    "wash and oil",
}
STOPWORDS_DE = {
    "und", "der", "die", "das", "für", "von", "am", "im", "an", "bei", "mit",
    "aus", "des", "den", "dem", "auf", "zu", "beziehungsweise", "bzw",
}
MIN_WORD_LEN = 6


def sig_words(title: str) -> set[str]:
    words = re.findall(r"[A-Za-zÄÖÜäöüß\-]+", title or "")
    return {w.lower() for w in words if len(w) >= MIN_WORD_LEN and w.lower() not in STOPWORDS_DE}


def terms_of(page: dict) -> set[str]:
    a = page.get("analysis") or {}
    out = set()
    for b in a.get("begriffe") or []:
        en = (b.get("en") or "").strip().lower()
        if en and en not in STOP_TERMS:
            out.add(en)
    return out


def title_overlap(a_words: set[str], b_title: str) -> int:
    b_low = (b_title or "").lower()
    return sum(1 for w in a_words if w in b_low)


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    pages = manifest["pages"]

    torque_pages = [p for p in pages if p["section_folder"] == TORQUE_FOLDER and p.get("section_no")]
    proc_by_group: dict[str, list] = defaultdict(list)
    for p in pages:
        if p["section_folder"] in EXCLUDE_FOLDERS:
            continue
        grp = p.get("section_no")
        # skip tables-of-contents/index pages: matching a torque table to a
        # TOC entry is technically "related" but not actionable during a job
        if "index" in p["image_file"].lower():
            continue
        if grp:
            proc_by_group[grp].append(p)

    by_id = {p["page_id"]: p for p in pages}
    proc_matches: dict[str, list] = defaultdict(list)  # procedure page_id -> [(torque_id, score)]

    n_torque_with_match = 0
    total_links = 0

    for tp in torque_pages:
        grp = tp["section_no"]
        candidates = proc_by_group.get(grp, [])
        if not candidates:
            tp["procedure_refs"] = []
            continue
        t_terms = terms_of(tp)
        t_words = sig_words(tp.get("titel_de") or "")
        ranked = []
        for pp in candidates:
            p_terms = terms_of(pp)
            shared = t_terms & p_terms
            word_hits = title_overlap(t_words, pp.get("titel_de") or "")
            score = 2 * len(shared) + word_hits
            if score >= MIN_SCORE:
                ranked.append((pp["page_id"], score, sorted(shared)))
        ranked.sort(key=lambda r: (-r[1], r[0]))
        top = ranked[:CAP_PER_TORQUE]
        tp["procedure_refs"] = [pid for pid, _, _ in top]
        tp["procedure_refs_meta"] = {pid: {"score": s, "shared": sh} for pid, s, sh in top}
        if top:
            n_torque_with_match += 1
        total_links += len(top)
        for pid, score, shared in top:
            proc_matches[pid].append((tp["page_id"], score, shared))

    n_proc_with_match = 0
    for pid, matches in proc_matches.items():
        matches.sort(key=lambda r: (-r[1], r[0]))
        top = matches[:CAP_PER_PROCEDURE]
        by_id[pid]["torque_refs"] = [tid for tid, _, _ in top]
        by_id[pid]["torque_refs_meta"] = {tid: {"score": s, "shared": sh} for tid, s, sh in top}
        n_proc_with_match += 1

    # ensure every procedure page has the (possibly empty) field for consistent rendering
    for grp_pages in proc_by_group.values():
        for pp in grp_pages:
            pp.setdefault("torque_refs", [])

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Torque pages considered      : {len(torque_pages)}")
    print(f"Torque pages with >=1 match  : {n_torque_with_match}")
    print(f"Procedure pages with >=1 match: {n_proc_with_match}")
    print(f"Total torque<->procedure links: {total_links}")
    print(f"manifest.json updated ({MANIFEST})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
