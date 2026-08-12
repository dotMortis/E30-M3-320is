#!/usr/bin/env python3
"""
Phase 1 — Extract structured data from the HTML scan-explorer into manifest.json.

Data sources (in priority order for captions):
  1. index-all.html          -> ~1065 captions, grouped by section folder
  2. <SECTION>/index.html     -> backfills captions for images missing above

Each image on disk becomes exactly one manifest record:
  {
    "page_id":          unique id (folder slug + image stem),
    "section_folder":   directory name (e.g. "34 - Brakes"),
    "section_no":       "34"  (may repeat across folders, hence page_id includes folder),
    "section_title_en": "Brakes",
    "image_path":       repo-relative path to the JPG,
    "image_file":       basename,
    "caption_en":       english caption or null,
    "caption_source":   "index-all" | "section-index" | null
  }

Tech-spec tables (M3-techspec.html / 320is-techspec.html) are parsed into a
separate structured block under manifest["techspecs"].

Re-runnable and side-effect free apart from writing manifest.json.
"""

from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "manifest.json"

# Matches: <a href="...something.jpg" ...>label</a><i>caption</i>
#          <a href="...something.jpg" ...>label</a>            (no caption)
ANCHOR_RE = re.compile(
    r'<a\s+href="([^"]+?\.jpg)"[^>]*>(.*?)</a>\s*(?:<i>(.*?)</i>)?',
    re.IGNORECASE | re.DOTALL,
)

# Section folder anchor in index-all.html:
#   <a href="./34%20-%20Brakes/" class="sectionTitle">Section 34 - Brakes</a>
SECTION_ANCHOR_RE = re.compile(
    r'<a\s+href="\.?/?([^"]+?)/"\s+class="sectionTitle"[^>]*>(.*?)</a>',
    re.IGNORECASE | re.DOTALL,
)

# <h2>Section 34 - Brakes</h2>  (per-section index.html)
H2_RE = re.compile(r"<h2>(.*?)</h2>", re.IGNORECASE | re.DOTALL)


def clean(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)          # strip any nested tags
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def decode_path(href: str) -> str:
    """Turn an href like ./34%20-%20Brakes/34-01.jpg into a repo-relative path."""
    href = unquote(href)
    href = href.lstrip("./")
    return href


def slugify(name: str) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "-", name).strip("-").lower()
    return s or "misc"


def parse_section_title(raw: str) -> tuple[str | None, str]:
    """'Section 34 - Brakes' -> ('34', 'Brakes'); falls back gracefully."""
    raw = clean(raw)
    m = re.match(r"(?:Section\s+)?([0-9A-Za-z]+)\s*-\s*(.+)", raw)
    if m:
        return m.group(1), m.group(2).strip()
    return None, raw


def list_disk_images() -> dict[str, Path]:
    """All JPGs on disk keyed by repo-relative posix path."""
    images: dict[str, Path] = {}
    for p in REPO.rglob("*.jpg"):
        rel = p.relative_to(REPO).as_posix()
        if rel.startswith((".git/", "vault/")):
            continue
        images[rel] = p
    # case-insensitive extension safety
    for p in REPO.rglob("*.JPG"):
        rel = p.relative_to(REPO).as_posix()
        if rel.startswith((".git/", "vault/")):
            continue
        images.setdefault(rel, p)
    return images


def parse_index_all() -> dict[str, str]:
    """
    Returns {repo_relative_image_path: caption_en} from index-all.html.
    Captions are associated by the folder-scoped href, so duplicate section
    numbers (41 - Body vs 41 - Body (Convertibles)) stay distinct.
    """
    path = REPO / "index-all.html"
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8", errors="replace")
    captions: dict[str, str] = {}
    for href, _label, caption in ANCHOR_RE.findall(text):
        if caption is None:
            continue
        cap = clean(caption)
        if not cap:
            continue
        rel = decode_path(href)
        captions.setdefault(rel, cap)
    return captions


def parse_section_indexes() -> dict[str, str]:
    """
    Backfill captions from each <SECTION>/index.html.
    Returns {repo_relative_image_path: caption_en}.
    """
    captions: dict[str, str] = {}
    for idx in REPO.rglob("index.html"):
        rel_dir = idx.parent.relative_to(REPO).as_posix()
        if rel_dir in ("", "."):
            continue  # skip root index.html (handled by index-all)
        if rel_dir.startswith((".git", "vault")):
            continue
        text = idx.read_text(encoding="utf-8", errors="replace")
        for href, _label, caption in ANCHOR_RE.findall(text):
            if caption is None:
                continue
            cap = clean(caption)
            if not cap:
                continue
            # hrefs here are relative to the section folder (./34-01.jpg)
            local = decode_path(href)
            rel = f"{rel_dir}/{Path(local).name}"
            captions.setdefault(rel, cap)
    return captions


def section_titles_from_index_all() -> dict[str, tuple[str | None, str]]:
    """{section_folder: (section_no, title_en)} from the sectionTitle anchors."""
    path = REPO / "index-all.html"
    out: dict[str, tuple[str | None, str]] = {}
    if not path.exists():
        return out
    text = path.read_text(encoding="utf-8", errors="replace")
    for href, label in SECTION_ANCHOR_RE.findall(text):
        folder = decode_path(href).rstrip("/")
        no, title = parse_section_title(label)
        out.setdefault(folder, (no, title))
    return out


def section_title_for(folder: str, from_index_all: dict) -> tuple[str | None, str]:
    if folder in from_index_all:
        return from_index_all[folder]
    # fall back to the folder's own index.html <h2>
    idx = REPO / folder / "index.html"
    if idx.exists():
        m = H2_RE.search(idx.read_text(encoding="utf-8", errors="replace"))
        if m:
            return parse_section_title(m.group(1))
    # last resort: derive from folder name "34 - Brakes"
    return parse_section_title(folder)


def parse_techspecs() -> list[dict]:
    specs = []
    for fname, model in (("M3-techspec.html", "M3"), ("320is-techspec.html", "320is")):
        p = REPO / fname
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        rows = []
        for tr in re.findall(r"<tr>(.*?)</tr>", text, re.IGNORECASE | re.DOTALL):
            cells = [clean(td) for td in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.IGNORECASE | re.DOTALL)]
            cells = [c for c in cells if c]
            if cells:
                rows.append(cells)
        specs.append({"model": model, "source_file": fname, "rows": rows, "row_count": len(rows)})
    return specs


def main() -> int:
    disk = list_disk_images()
    cap_all = parse_index_all()
    cap_sec = parse_section_indexes()
    titles = section_titles_from_index_all()

    records = []
    seen_ids: set[str] = set()
    stats = {"from_index_all": 0, "from_section_index": 0, "no_caption": 0}

    for rel in sorted(disk):
        folder = str(Path(rel).parent)
        section_no, section_title = section_title_for(folder, titles)
        stem = Path(rel).stem

        caption = None
        source = None
        if rel in cap_all:
            caption, source = cap_all[rel], "index-all"
            stats["from_index_all"] += 1
        elif rel in cap_sec:
            caption, source = cap_sec[rel], "section-index"
            stats["from_section_index"] += 1
        else:
            stats["no_caption"] += 1

        page_id = f"{slugify(folder)}__{slugify(stem)}"
        # guarantee uniqueness even in pathological cases
        base = page_id
        n = 2
        while page_id in seen_ids:
            page_id = f"{base}-{n}"
            n += 1
        seen_ids.add(page_id)

        records.append({
            "page_id": page_id,
            "section_folder": folder,
            "section_no": section_no,
            "section_title_en": section_title,
            "image_path": rel,
            "image_file": Path(rel).name,
            "caption_en": caption,
            "caption_source": source,
            # populated in Phase 2
            "analysis": None,
        })

    manifest = {
        "meta": {
            "repo": REPO.name,
            "total_images": len(records),
            "caption_stats": stats,
            "sections": sorted({r["section_folder"] for r in records}),
        },
        "pages": records,
        "techspecs": parse_techspecs(),
    }

    OUT.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote {OUT.relative_to(REPO)}")
    print(f"  images on disk : {len(records)}")
    print(f"  captions (index-all)     : {stats['from_index_all']}")
    print(f"  captions (section-index) : {stats['from_section_index']}")
    print(f"  no caption               : {stats['no_caption']}")
    print(f"  sections                 : {len(manifest['meta']['sections'])}")
    print(f"  techspec tables          : {len(manifest['techspecs'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
