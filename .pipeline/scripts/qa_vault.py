#!/usr/bin/env python3
"""Phase C — QA over the clean German vault (repo root = vault root).

Notes and scans are co-located in German section (sub-)folders. Links are bare
wikilink stems; embeds are bare image filenames resolved within the same vault.
"""
from __future__ import annotations
import re
from pathlib import Path

PIPE = Path(__file__).resolve().parent.parent
REPO = PIPE.parent
VAULT_ROOT = REPO

EMBED_RE = re.compile(r"!\[\[([^\]|]+?)\]\]")
LINK_RE = re.compile(r"(?<!!)\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]")

IGNORE_DIRS = {".git", ".obsidian", ".pipeline"}


def iter_md():
    for p in VAULT_ROOT.rglob("*.md"):
        if any(part in IGNORE_DIRS for part in p.relative_to(VAULT_ROOT).parts):
            continue
        yield p


def iter_images():
    exts = {".jpg", ".jpeg", ".png", ".gif"}
    for p in VAULT_ROOT.rglob("*"):
        if p.suffix.lower() not in exts:
            continue
        if any(part in IGNORE_DIRS for part in p.relative_to(VAULT_ROOT).parts):
            continue
        yield p


def main() -> int:
    md_files = list(iter_md())
    images = list(iter_images())
    image_names = {p.name for p in images}
    note_stems = {p.stem for p in md_files}

    # Image filenames that live in more than one folder. A bare embed ![[name]]
    # of such a file is ambiguous: Obsidian resolves it to a single arbitrary
    # match, so notes in the other folder(s) show the wrong or a missing image.
    from collections import Counter
    name_counts = Counter(p.name for p in images)
    dup_image_names = {n for n, c in name_counts.items() if c > 1}

    problems = []
    embed_count = link_count = 0
    stem_seen = {}

    for p in md_files:
        # filename uniqueness (Obsidian resolves bare links by name)
        if p.stem in stem_seen:
            problems.append(f"DUP NOTE NAME: {p.stem}  ({p}) & ({stem_seen[p.stem]})")
        else:
            stem_seen[p.stem] = p

        raw = p.read_bytes()
        if b"\x00" in raw:
            problems.append(f"NUL BYTE: {p.relative_to(VAULT_ROOT)}")
        text = raw.decode("utf-8", "replace")

        for m in EMBED_RE.findall(text):
            embed_count += 1
            name = m.split("/")[-1]
            if name not in image_names:
                problems.append(f"MISSING IMAGE: {p.relative_to(VAULT_ROOT)} -> {m}")
            elif "/" not in m and name in dup_image_names:
                # bare embed of a non-unique filename -> resolves ambiguously
                problems.append(f"AMBIGUOUS EMBED: {p.relative_to(VAULT_ROOT)} -> {m}")

        for m in LINK_RE.findall(text):
            link_count += 1
            target = m.split("/")[-1]
            if target not in note_stems:
                problems.append(f"BROKEN LINK: {p.relative_to(VAULT_ROOT)} -> [[{m}]]")

    # every scan should be embedded somewhere (no orphans)
    embedded = set()
    for p in md_files:
        for m in EMBED_RE.findall(p.read_text(encoding="utf-8", errors="replace")):
            embedded.add(m.split("/")[-1])
    orphans = image_names - embedded

    de_terms = ["Bremsscheibe", "Nockenwelle", "Drehmoment", "Kupplung", "Kühler", "Sicherung"]
    hits = {t: sum(1 for p in md_files if t in p.read_text(encoding="utf-8", errors="replace"))
            for t in de_terms}

    print(f"Notes            : {len(md_files)}")
    print(f"Images           : {len(images)}")
    print(f"Image embeds     : {embed_count}")
    print(f"Internal links   : {link_count}")
    print(f"Orphan images    : {len(orphans)}")
    for o in sorted(orphans)[:10]:
        print(f"   orphan: {o}")
    print("DE search sanity :")
    for t, n in hits.items():
        print(f"   {t:<16} in {n} notes")
    print(f"Problems         : {len(problems)}")
    for pr in problems[:40]:
        print("  " + pr)
    if len(problems) > 40:
        print(f"  ... and {len(problems)-40} more")
    return 1 if (problems or orphans) else 0


if __name__ == "__main__":
    raise SystemExit(main())
