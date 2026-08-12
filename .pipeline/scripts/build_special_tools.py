#!/usr/bin/env python3
"""Phase 10 (post-hoc) — Consolidated BMW special-tool (Sonderwerkzeug) index.

"special tool" is the single most frequent glossary term in the whole vault
(160+ page hits), yet there is no way to see ahead of a job which BMW special
tools you'll need, or which other jobs share a tool you already have/rent.
This script regex-extracts BMW special-tool numbers (format "NN N NNN" /
"NN NN NNN", e.g. "11 0 000") from the German transcription+description text
near the words "Sonderwerkzeug"/"Spezialwerkzeug", aggregates them across the
whole vault, and writes one browsable top-level note (Sonderwerkzeuge.md)
grouped by BMW group number, each tool number linking back to every page
that references it.

Re-runnable / regenerable; writes Sonderwerkzeuge.md at the repo root.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

PIPE = Path(__file__).resolve().parent.parent
REPO = PIPE.parent
MANIFEST = PIPE / "manifest.json"
OUT = REPO / "Sonderwerkzeuge.md"

KEYWORD_RE = re.compile(r"Sonderwerkzeug(?:e|es|s)?|Spezialwerkzeug(?:e|es|s)?", re.I)
NUMBER_RE = re.compile(r"\b(\d{2})\s(\d{1,2})\s(\d{3})\b")
WINDOW = 90  # chars after the keyword to search for an associated tool number

# Sub-set of section_folder names to exclude (reference/meta collections whose
# note_stem() we can't cheaply resolve the same way as the main build).
EXCLUDE_FOLDERS = {"1990 BMW M3 Electrical Troubleshooting Manual"}


def sanitize(s):
    if not isinstance(s, str):
        return s
    s = re.sub(r"(?<=[A-Za-zÄÖÜäöüß])\x00(?=[A-Za-zÄÖÜäöüß])", "ü", s)
    return s


def fs_safe(name: str, cap: int = 90) -> str:
    name = sanitize(name or "")
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', " ", name)
    name = name.replace("[", "(").replace("]", ")")
    name = re.sub(r"\s+", " ", name).strip().strip(".")
    if len(name) > cap:
        name = name[:cap].rsplit(" ", 1)[0].rstrip(" -—")
    return name or "ohne-Titel"


def code_of(page: dict) -> str:
    return re.sub(r"\.jpg$", "", page["image_file"], flags=re.I)


def note_stem(page: dict) -> str:
    return f"{code_of(page)} — {fs_safe(page.get('titel_de') or page['image_file'])}"


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    pages = manifest["pages"]

    tool_pages: dict[str, set] = defaultdict(set)
    for p in pages:
        if p["section_folder"] in EXCLUDE_FOLDERS:
            continue
        a = p.get("analysis") or {}
        text = sanitize(a.get("transkription") or "") + " " + sanitize(a.get("beschreibung") or "")
        for km in KEYWORD_RE.finditer(text):
            window = text[km.end():km.end() + WINDOW]
            for g1, g2, g3 in NUMBER_RE.findall(window):
                tool_pages[f"{g1} {g2} {g3}"].add(p["page_id"])

    by_id = {p["page_id"]: p for p in pages}

    # group by BMW group number (first component of the tool number)
    by_group: dict[str, list[str]] = defaultdict(list)
    for tool in tool_pages:
        grp = tool.split()[0]
        by_group[grp].append(tool)

    lines = [
        "---",
        'titel: "Sonderwerkzeuge"',
        "tags:\n  - sonderwerkzeug\n  - nachschlagen",
        "---",
        "",
        "# Sonderwerkzeuge — BMW-Spezialwerkzeug-Index",
        "",
        f"> [!abstract] {len(tool_pages)} BMW-Sonderwerkzeugnummern, automatisch aus den "
        "Transkriptionen extrahiert, mit Rückverweisen auf jede Seite, die das jeweilige "
        "Werkzeug erwähnt.",
        "",
        "> [!tip] Verwendung",
        "> Vor einem größeren Arbeitsschritt (z. B. Motorausbau) hier nachsehen, welche "
        "BMW-Sonderwerkzeuge auf den betroffenen Seiten vorkommen — so lassen sie sich "
        "vorher besorgen/leihen/nachbauen, statt erst währenddessen aufzufallen.",
        "",
    ]

    for grp in sorted(by_group, key=lambda g: (len(g), g)):
        tools = sorted(by_group[grp], key=lambda t: [int(x) for x in t.split()])
        lines.append(f"## Gruppe {grp}")
        lines.append("")
        for tool in tools:
            pids = sorted(tool_pages[tool])
            # bare wikilinks (no alias) -- table-cell alias-pipe escaping is
            # fragile in Obsidian, so this vault's convention (see
            # build_section_moc's row()) is to avoid aliasing inside tables;
            # a bullet list sidesteps the issue entirely.
            lines.append(f"**`{tool}`**")
            for pid in pids:
                if pid in by_id:
                    lines.append(f"- [[{note_stem(by_id[pid])}]]")
            lines.append("")

    lines += ["---", "[[Startseite]] · [[Glossar]]", ""]
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT}: {len(tool_pages)} tool numbers across {sum(len(v) for v in tool_pages.values())} page-refs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
