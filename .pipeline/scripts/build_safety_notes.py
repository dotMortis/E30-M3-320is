#!/usr/bin/env python3
"""Phase 11 (post-hoc) — Consolidated safety-warnings rollup.

204 pages across the vault contain an explicit "Wichtig!"/"Achtung"
callout in their transcription (test-stand speed limits, R12 handling,
airbag/SRS notes, brake-system warnings, etc.), but each is only visible if
you happen to open that exact page. This script extracts every such warning
paragraph, groups them by BMW group number, and writes one browsable
top-level note (Sicherheitshinweise.md) so warnings relevant to an upcoming
job can be reviewed in one place beforehand.

Re-runnable / regenerable; writes Sicherheitshinweise.md at the repo root.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

PIPE = Path(__file__).resolve().parent.parent
REPO = PIPE.parent
MANIFEST = PIPE / "manifest.json"
OUT = REPO / "Sicherheitshinweise.md"

WARN_RE = re.compile(r"\b(Wichtig|Achtung)\b\s*[!:]?\s*", re.I)
MAX_LEN = 400

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


def extract_warnings(text: str) -> list[str]:
    out = []
    for m in WARN_RE.finditer(text):
        rest = text[m.end():m.end() + MAX_LEN]
        # cut at the first paragraph break (blank line); else at MAX_LEN,
        # backing off to the last full word.
        para_end = re.search(r"\n\s*\n", rest)
        snippet = rest[:para_end.start()] if para_end else rest
        snippet = " ".join(snippet.split())
        if len(snippet) >= MAX_LEN - 1:
            snippet = snippet.rsplit(" ", 1)[0] + " …"
        if snippet:
            out.append(snippet)
    return out


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    pages = manifest["pages"]

    by_group: dict[str, list[tuple]] = defaultdict(list)
    n_pages = n_warnings = 0

    for p in pages:
        if p["section_folder"] in EXCLUDE_FOLDERS:
            continue
        a = p.get("analysis") or {}
        text = sanitize(a.get("transkription") or "")
        warnings = extract_warnings(text)
        if not warnings:
            continue
        n_pages += 1
        n_warnings += len(warnings)
        grp = p.get("section_no") or "?"
        by_group[grp].append((p, warnings))

    lines = [
        "---",
        'titel: "Sicherheitshinweise"',
        "tags:\n  - sicherheitshinweis\n  - nachschlagen",
        "---",
        "",
        "# Sicherheitshinweise — Warnhinweise aus dem Handbuch",
        "",
        f"> [!abstract] {n_warnings} Warnhinweise auf {n_pages} Seiten, automatisch aus "
        '"Wichtig!"/"Achtung"-Textstellen der Transkription extrahiert.',
        "",
        "> [!warning] Hinweis",
        "> Diese Zusammenfassung dient der Vorbereitung eines Arbeitsschritts. Für die "
        "verbindliche Formulierung und den vollen Kontext gilt immer die verlinkte Originalseite.",
        "",
    ]

    for grp in sorted(by_group, key=lambda g: (g == "?", len(g), g)):
        entries = sorted(by_group[grp], key=lambda e: code_of(e[0]))
        title = f"Gruppe {grp}" if grp != "?" else "Ohne eindeutigen Abschnitt"
        lines.append(f"## {title}")
        lines.append("")
        for p, warnings in entries:
            lines.append(f"**[[{note_stem(p)}]]**")
            for w in warnings:
                lines.append(f"> [!warning] {w}")
            lines.append("")

    lines += ["---", "[[Startseite]] · [[Glossar]]", ""]
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT}: {n_warnings} warnings across {n_pages} pages")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
