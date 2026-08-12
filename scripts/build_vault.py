#!/usr/bin/env python3
"""
Phase 4/5/6 — Generate the self-contained bilingual Obsidian vault.

Reads manifest.json + glossary.json and produces under vault/:
  <Section DE>/<page_id>.md   page notes (scan + EN caption + German analysis)
  <Section DE>/_ÜBERSICHT.md  section MOC (map of content) with German title + page list
  Startseite.md               German landing page -> all sections + specs + glossary
  Glossar.md                  bilingual EN<->DE glossary note
  Technische-Daten.md         tech-spec tables (M3 / 320is)
  _attachments/<file>.jpg     full-resolution scans copied for offline zoom
  .obsidian/                  core Search + attachment folder + Image Toolkit enabled

Layout per page (Phase 6): original scan on top, German translation beneath,
EN caption shown for reference, German callouts, DE tags for filtering.

Idempotent: safe to re-run; vault/ content is regenerated. Images copy only when
missing or size-changed.
"""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MANIFEST = REPO / "manifest.json"
GLOSSARY = REPO / "glossary.json"
VAULT = REPO / "vault"
ATTACH = VAULT / "_attachments"
OBS = VAULT / ".obsidian"

TYPE_DE = {"diagram": "Diagramm", "table": "Tabelle", "text": "Text"}


def slug_folder(name: str) -> str:
    # Obsidian-safe folder name; keep readable German
    return re.sub(r'[<>:"/\\|?*]', "-", name).strip()


def esc_yaml(s: str) -> str:
    s = (s or "").replace('"', "'")
    return s


def md_escape_caption(s: str) -> str:
    return (s or "").strip()


def transcription_block(text: str) -> str:
    text = (text or "").strip()
    if not text:
        return ""
    # collapsible callout; indent each line with '> '
    lines = text.split("\n")
    body = "\n".join(f"> {ln}" if ln.strip() else ">" for ln in lines)
    return "> [!note]- Transkription (aufklappen)\n" + body + "\n"


def begriffe_table(pairs: list[dict]) -> str:
    if not pairs:
        return ""
    rows = ["| Englisch | Deutsch |", "| --- | --- |"]
    seen = set()
    for p in pairs:
        en = (p.get("en") or "").strip()
        de = (p.get("de") or "").strip()
        if not en and not de:
            continue
        key = (en.lower(), de.lower())
        if key in seen:
            continue
        seen.add(key)
        en = en.replace("|", "\\|")
        de = de.replace("|", "\\|")
        rows.append(f"| {en} | {de} |")
    return "\n".join(rows)


def attachment_name(page: dict) -> str:
    """Unique attachment filename (basenames collide across sections)."""
    ext = Path(page["image_file"]).suffix or ".jpg"
    return f"{page['page_id']}{ext}"


def build_page_note(page: dict, section_de: str) -> str:
    a = page.get("analysis") or {}
    page_id = page["page_id"]
    section_no = page.get("section_no") or "??"
    seitentyp = a.get("seitentyp") or "text"
    typ_de = TYPE_DE.get(seitentyp, seitentyp)
    konf = a.get("konfidenz")
    caption = md_escape_caption(page.get("caption_en") or "")
    img_file = attachment_name(page)

    tags = [f"sektion/{section_no}", "seite", f"typ/{seitentyp}"]
    konf_low = (konf is not None and konf < 0.6)
    if konf_low:
        tags.append("pruefen")

    fm = [
        "---",
        f'titel: "{esc_yaml(page_id)}"',
        f'sektion_nr: "{esc_yaml(str(section_no))}"',
        f'sektion: "{esc_yaml(section_de)}"',
        f'seitentyp: "{esc_yaml(seitentyp)}"',
        f"konfidenz: {konf if konf is not None else 'null'}",
        f'bilddatei: "{esc_yaml(page["image_file"])}"',
        "tags:",
    ]
    for t in tags:
        fm.append(f"  - {t}")
    fm.append("---")

    parts = ["\n".join(fm), ""]
    parts.append(f"# {page_id}  ·  {section_de}")
    parts.append("")
    parts.append("> [!info] Originalseite oben, Übersetzung unten")
    parts.append(f"> Typ: **{typ_de}**" + (f" · Konfidenz: **{konf:.2f}**" if konf is not None else ""))
    parts.append("> Die **Originalseite ist maßgeblich**; die deutsche Übersetzung dient der Suche und dem Verständnis.")
    parts.append("")
    # original scan
    parts.append(f"![[{img_file}]]")
    parts.append("")
    if caption:
        parts.append(f"*Originaltitel (EN): {caption}*")
        parts.append("")
    parts.append("---")
    parts.append("")
    # German description
    parts.append("## Beschreibung")
    parts.append(a.get("beschreibung") or "_Keine Beschreibung verfügbar._")
    parts.append("")
    # transcription
    trans = transcription_block(a.get("transkription") or "")
    if trans:
        parts.append("## Transkription")
        parts.append(trans)
        parts.append("")
    # terms
    tbl = begriffe_table(a.get("begriffe") or [])
    if tbl:
        parts.append("## Fachbegriffe (EN → DE)")
        parts.append(tbl)
        parts.append("")
    parts.append("---")
    parts.append("[[Startseite]] · [[_ÜBERSICHT|Abschnittsübersicht]] · [[Glossar]]")
    parts.append("")
    return "\n".join(parts)


def build_section_moc(section_de: str, section_no: str, pages: list[dict]) -> str:
    fm = [
        "---",
        f'titel: "{esc_yaml(section_de)}"',
        f'sektion_nr: "{esc_yaml(str(section_no))}"',
        "tags:",
        f"  - sektion/{section_no}",
        "  - uebersicht",
        "---",
        "",
        f"# Abschnitt {section_no} — {section_de}",
        "",
        f"> [!abstract] {len(pages)} Seiten in diesem Abschnitt",
        "",
        "| Seite | Typ | Beschreibung (EN) |",
        "| --- | --- | --- |",
    ]
    for p in sorted(pages, key=lambda x: x["image_file"]):
        a = p.get("analysis") or {}
        typ = TYPE_DE.get(a.get("seitentyp"), a.get("seitentyp") or "")
        cap = (p.get("caption_en") or "").replace("|", "\\|")
        fm.append(f"| [[{p['page_id']}]] | {typ} | {cap} |")
    fm += ["", "---", "[[Startseite]] · [[Glossar]] · [[Technische-Daten]]", ""]
    return "\n".join(fm)


def build_home(sections: dict, section_pages: dict) -> str:
    lines = [
        "---",
        'titel: "Startseite"',
        "tags:",
        "  - startseite",
        "---",
        "",
        "# BMW E30 M3 / 320is — Reparaturhandbuch (zweisprachig)",
        "",
        "> [!tip] Willkommen!",
        "> Dieses Wissensarchiv enthält das originale BMW-Werkstatthandbuch als **gescannte Seiten**",
        "> mit **deutscher Übersetzung** (Beschreibung, Transkription, Fachbegriffe). ",
        "> Nutze die **Suche** (oben links / `Strg`+`Umschalt`+`F`) — sie funktioniert auf Deutsch und Englisch.",
        "",
        "## Abschnitte",
        "",
    ]
    # order by section number then name
    def sort_key(item):
        folder, meta = item
        no = meta.get("no") or "zzz"
        return (str(no), folder)

    for folder, meta in sorted(sections.items(), key=sort_key):
        de = meta["de"]
        no = meta.get("no") or ""
        count = len(section_pages.get(folder, []))
        folder_slug = slug_folder(de if no == "" else f"{no} - {de}")
        lines.append(f"- **{no}** · [[{folder_slug}/_ÜBERSICHT|{de}]] — {count} Seiten")
    lines += [
        "",
        "## Nachschlagen",
        "- [[Glossar]] — zweisprachiges Fachwörterbuch (EN ↔ DE)",
        "- [[Technische-Daten]] — technische Daten M3 / 320is",
        "- [[LIESMICH]] — Anleitung (Installation, Suche, Zoom)",
        "",
        "> [!note] Hinweis zur Genauigkeit",
        "> Die deutschen Texte wurden automatisch aus den Scans von 1989 erzeugt und dienen der",
        "> **Durchsuchbarkeit und dem Verständnis**. Im Zweifel gilt immer die **Originalseite**.",
        "",
    ]
    return "\n".join(lines)


def build_glossary_note(glossary: dict) -> str:
    terms = glossary["terms"]
    lines = [
        "---",
        'titel: "Glossar"',
        "tags:",
        "  - glossar",
        "---",
        "",
        "# Glossar — Fachbegriffe EN ↔ DE",
        "",
        f"> [!abstract] {len(terms)} Begriffe, aus allen Seiten zusammengeführt.",
        "> Häufigkeit = wie oft der Begriff im Handbuch erkannt wurde.",
        "",
        "| Englisch | Deutsch | Häufigkeit | Varianten |",
        "| --- | --- | ---: | --- |",
    ]
    for t in terms:
        en = t["en"].replace("|", "\\|")
        de = t["de"].replace("|", "\\|")
        var = ", ".join(t.get("variants") or []).replace("|", "\\|")
        star = " ⭐" if t.get("canonical") else ""
        lines.append(f"| {en}{star} | {de} | {t['count']} | {var} |")
    lines += ["", "⭐ = kuratierter Standardbegriff", "", "[[Startseite]]", ""]
    return "\n".join(lines)


def build_techspec_note(techspecs: list[dict]) -> str:
    lines = [
        "---",
        'titel: "Technische Daten"',
        "tags:",
        "  - technische-daten",
        "---",
        "",
        "# Technische Daten",
        "",
    ]
    for spec in techspecs:
        lines.append(f"## {spec['model']}")
        lines.append("")
        for row in spec["rows"]:
            row = [c.replace("|", "\\|") for c in row]
            if len(row) == 1:
                lines.append(f"**{row[0]}**")
            else:
                lines.append("| " + " | ".join(row) + " |")
                # add a separator after the first row of each contiguous block is tricky;
                # keep simple: render as plain bullet-ish line
        lines.append("")
    lines += ["[[Startseite]]", ""]
    return "\n".join(lines)


def write_obsidian_config():
    OBS.mkdir(parents=True, exist_ok=True)
    # app.json: attachment folder + default view
    (OBS / "app.json").write_text(json.dumps({
        "attachmentFolderPath": "_attachments",
        "newFileLocation": "root",
        "alwaysUpdateLinks": True,
        "showUnsupportedFiles": False,
    }, indent=2), encoding="utf-8")
    # core-plugins: ensure global search is on
    core = [
        "file-explorer", "global-search", "switcher", "graph", "backlink",
        "outgoing-link", "tag-pane", "page-preview", "note-composer",
        "command-palette", "markdown-importer", "outline", "word-count",
        "file-recovery",
    ]
    (OBS / "core-plugins.json").write_text(json.dumps(core, indent=2), encoding="utf-8")
    # community plugin enabled list (Image Toolkit). Binary must be installed by user
    # via Obsidian's community browser; enabling it here means it activates once present.
    (OBS / "community-plugins.json").write_text(
        json.dumps(["obsidian-image-toolkit"], indent=2), encoding="utf-8")
    # appearance: readable line length off for wide diagrams
    (OBS / "appearance.json").write_text(json.dumps({
        "readableLineLength": False,
        "theme": "obsidian",
    }, indent=2), encoding="utf-8")
    # Image Toolkit default settings (used once the plugin is installed)
    itk_dir = OBS / "plugins" / "obsidian-image-toolkit"
    itk_dir.mkdir(parents=True, exist_ok=True)
    (itk_dir / "data.json").write_text(json.dumps({
        "viewImageGlobal": True,
        "viewImageInCPB": True,
        "viewImageWithLink": True,
        "viewImageOther": True,
        "imageMoveSpeed": 10,
        "imgTipToggle": True,
        "imgFullScreenMode": "FIT",
    }, indent=2), encoding="utf-8")


def copy_images(pages: list[dict]) -> int:
    ATTACH.mkdir(parents=True, exist_ok=True)
    copied = 0
    for p in pages:
        src = REPO / p["image_path"]
        dst = ATTACH / attachment_name(p)
        if not src.exists():
            continue
        if dst.exists() and dst.stat().st_size == src.stat().st_size:
            continue
        shutil.copy2(src, dst)
        copied += 1
    return copied


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    glossary = json.loads(GLOSSARY.read_text(encoding="utf-8"))
    sections_meta = glossary["sections"]

    VAULT.mkdir(exist_ok=True)

    # group pages by folder
    section_pages: dict[str, list] = {}
    for p in manifest["pages"]:
        section_pages.setdefault(p["section_folder"], []).append(p)

    # attachment images
    n_copied = copy_images(manifest["pages"])

    # per-section notes + MOCs
    n_pages = 0
    dupe_guard: set[str] = set()
    for folder, pages in section_pages.items():
        meta = sections_meta.get(folder, {"no": None, "de": folder, "en": folder})
        no = meta.get("no") or ""
        de = meta["de"]
        dir_name = slug_folder(de if no == "" else f"{no} - {de}")
        sec_dir = VAULT / dir_name
        sec_dir.mkdir(parents=True, exist_ok=True)

        for p in pages:
            # guarantee unique note filename across whole vault (page_id already unique)
            note_name = p["page_id"]
            assert note_name not in dupe_guard, f"dup note {note_name}"
            dupe_guard.add(note_name)
            (sec_dir / f"{note_name}.md").write_text(
                build_page_note(p, de), encoding="utf-8")
            n_pages += 1

        (sec_dir / "_ÜBERSICHT.md").write_text(
            build_section_moc(de, no, pages), encoding="utf-8")

    # top-level notes
    (VAULT / "Startseite.md").write_text(
        build_home(sections_meta, section_pages), encoding="utf-8")
    (VAULT / "Glossar.md").write_text(
        build_glossary_note(glossary), encoding="utf-8")
    (VAULT / "Technische-Daten.md").write_text(
        build_techspec_note(manifest.get("techspecs") or []), encoding="utf-8")

    write_obsidian_config()

    print("Vault built at", VAULT.relative_to(REPO))
    print(f"  page notes     : {n_pages}")
    print(f"  sections       : {len(section_pages)}")
    print(f"  images copied  : {n_copied} (into _attachments)")
    print(f"  glossary terms : {len(glossary['terms'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
