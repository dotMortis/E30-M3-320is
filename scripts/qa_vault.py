#!/usr/bin/env python3
"""Phase 7 — QA checks over the generated vault."""
from __future__ import annotations
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
VAULT = REPO / "vault"
ATTACH = VAULT / "_attachments"

EMBED_RE = re.compile(r"!\[\[([^\]|]+?)\]\]")
LINK_RE = re.compile(r"(?<!!)\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]")


def main() -> int:
    md_files = [p for p in VAULT.rglob("*.md")]
    note_names = {p.stem for p in md_files}
    # also allow "folder/_ÜBERSICHT" style targets
    link_targets = set(note_names)
    for p in md_files:
        rel = p.relative_to(VAULT).with_suffix("").as_posix()
        link_targets.add(rel)
        link_targets.add(p.stem)

    attachments = {p.name for p in ATTACH.glob("*")}

    problems = []
    embed_count = 0
    link_count = 0
    for p in md_files:
        text = p.read_text(encoding="utf-8")
        for m in EMBED_RE.findall(text):
            embed_count += 1
            if m not in attachments:
                problems.append(f"MISSING IMAGE: {p.relative_to(VAULT)} -> {m}")
        for m in LINK_RE.findall(text):
            link_count += 1
            target = m.split("/")[-1]
            if target not in link_targets and m not in link_targets:
                problems.append(f"BROKEN LINK: {p.relative_to(VAULT)} -> [[{m}]]")

    # DE search sanity: pick known German terms and confirm presence
    de_terms = ["Bremsscheibe", "Nockenwelle", "Drehmoment", "Kupplung", "Kühler"]
    search_hits = {t: 0 for t in de_terms}
    for p in md_files:
        text = p.read_text(encoding="utf-8")
        for t in de_terms:
            if t in text:
                search_hits[t] += 1

    print(f"Notes            : {len(md_files)}")
    print(f"Image embeds     : {embed_count}")
    print(f"Internal links   : {link_count}")
    print(f"Attachments      : {len(attachments)}")
    print("DE search sanity :")
    for t, n in search_hits.items():
        print(f"   {t:<16} in {n} notes")
    print(f"Problems         : {len(problems)}")
    for pr in problems[:40]:
        print("  " + pr)
    if len(problems) > 40:
        print(f"  ... and {len(problems)-40} more")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
