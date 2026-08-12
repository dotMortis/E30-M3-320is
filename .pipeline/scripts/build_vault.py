#!/usr/bin/env python3
"""
Phase B — Build the clean, German, well-structured Obsidian vault.

The REPO root IS the Obsidian vault. Each section becomes a German-named folder
holding BOTH the original scans and their notes, co-located. Large sections are
sub-grouped by BMW code band into topic sub-folders.

Per page:
  <Section DE>/[<Subgroup>/]<code> — <titel_de>.md   note (scan embedded in-folder)
  <Section DE>/[<Subgroup>/]<code>.jpg                original scan (git mv'd here)

Also:
  Startseite.md, Glossar.md, Technische-Daten.md      top-level German notes
  <Section DE>/_Übersicht.md                          per-section index (MOC)
  .obsidian/                                          search + Image Toolkit zoom

Filenames: '<code> — <title>' stems are globally unique, so notes link by bare
name ([[stem]]). Scans are moved with `git mv` to preserve bytes + history.
Scan embeds use the bare filename when unique, but fall back to a vault-relative
path when the same scan filename occurs in more than one folder (duplicate BMW
page codes across sections) so Obsidian always resolves the correct image.

No information loss: EN caption, German description, full transcription, term
table and metadata are all retained in each note; tooling stays under .pipeline/.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

PIPE = Path(__file__).resolve().parent.parent          # .pipeline/
REPO = PIPE.parent                                      # repo root = vault root
MANIFEST = PIPE / "manifest.json"
GLOSSARY = PIPE / "glossary.json"
OBS = REPO / ".obsidian"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_techdata  # noqa: E402
import build_special_tools  # noqa: E402
import build_safety_notes  # noqa: E402

TYPE_DE = {"diagram": "Diagramm", "table": "Tabelle", "text": "Text"}
SUBGROUP_THRESHOLD = 60          # only sections larger than this get sub-grouped

# Obsidian resolves a bare wikilink embed (![[name]]) by unique filename. That
# is the canonical, most reliable form -- but it is ambiguous when the same
# filename occurs in more than one folder (duplicate BMW page codes across
# sections), where Obsidian would pick one arbitrary match. Bare names are
# therefore used for unique scans, and an explicit vault-relative path is
# emitted only for the duplicates. DUP_IMAGE_NAMES is populated in main().
DUP_IMAGE_NAMES: set[str] = set()

# Populated in main(): resolve related-page links and mentioned-section links.
# PAGE_BY_ID maps page_id -> page dict (for related wikilink stems); SECTION_MOC_BY_NO
# maps a BMW group number ("34") -> that section's MOC stem for "Erwähnte Abschnitte".
PAGE_BY_ID: dict[str, dict] = {}
SECTION_MOC_BY_NO: dict[str, str] = {}
# Sections for which the related/mentioned blocks are rendered. Empty set = all.
RENDER_RELATED_SECTIONS: set[str] = set()


def embed_target(img: str, dest_dir: Path) -> str:
    """Embed path for a scan: bare filename if unique, else vault-relative."""
    if img in DUP_IMAGE_NAMES:
        return (dest_dir / img).relative_to(REPO).as_posix()
    return img

_CTRL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
_FS_BAD = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def sanitize(s):
    """Repair the model's stray-NUL-for-umlaut glitch, strip control chars."""
    if not isinstance(s, str):
        return s
    s = re.sub(r"(?<=[A-Za-zÄÖÜäöüß])\x00(?=[A-Za-zÄÖÜäöüß])", "ü", s)
    return _CTRL_RE.sub("", s)


# Obsidian on some platforms (observed on Linux/Electron) fails to serve image
# embeds via the app:// scheme when a FOLDER in the path contains a non-ASCII
# character (e.g. umlauts). Folder names are therefore transliterated to ASCII.
# Note filenames and titles keep their German umlauts -- only directory names
# are affected, which is what breaks image rendering.
_TRANSLIT = str.maketrans({
    "ä": "ae", "ö": "oe", "ü": "ue",
    "Ä": "Ae", "Ö": "Oe", "Ü": "Ue", "ß": "ss",
    "é": "e", "è": "e", "á": "a", "à": "a", "ñ": "n", "ç": "c",
})


def ascii_fold(s: str) -> str:
    """Transliterate common non-ASCII letters to ASCII (for folder names)."""
    return (s or "").translate(_TRANSLIT)


def fs_safe_dir(name: str, cap: int = 90) -> str:
    """Like fs_safe but ASCII-only, for directory names (app:// image fix)."""
    return fs_safe(ascii_fold(name), cap=cap)


def fs_safe(name: str, cap: int = 90) -> str:
    """Filesystem/Obsidian-safe component (keeps German letters, spaces, dashes)."""
    name = sanitize(name or "")
    name = _FS_BAD.sub(" ", name)
    name = name.replace("[", "(").replace("]", ")")
    name = re.sub(r"\s+", " ", name).strip().strip(".")
    if len(name) > cap:
        name = name[:cap].rsplit(" ", 1)[0].rstrip(" -—")
    return name or "ohne-Titel"


def code_of(page: dict) -> str:
    return re.sub(r"\.jpg$", "", page["image_file"], flags=re.I)


def note_stem(page: dict) -> str:
    return f"{code_of(page)} — {fs_safe(page.get('titel_de') or page['image_file'])}"


def esc_yaml(s: str) -> str:
    return (s or "").replace('"', "'")


def transcription_block(text: str) -> str:
    text = (text or "").strip()
    if not text:
        return ""
    lines = text.split("\n")
    body = "\n".join(f"> {ln}" if ln.strip() else ">" for ln in lines)
    return "> [!note]- Transkription (aufklappen)\n" + body + "\n"


def begriffe_table(pairs) -> str:
    if not pairs:
        return ""
    rows = ["| Englisch | Deutsch |", "| --- | --- |"]
    seen = set()
    for p in pairs:
        en = sanitize(p.get("en") or "").strip()
        de = sanitize(p.get("de") or "").strip()
        if not en and not de:
            continue
        k = (en.lower(), de.lower())
        if k in seen:
            continue
        seen.add(k)
        rows.append(f"| {en.replace('|', '\\|')} | {de.replace('|', '\\|')} |")
    return "\n".join(rows)


# ---------------------------------------------------------------- sub-grouping

def band_key(page: dict) -> str:
    """BMW code band used to cluster a section's pages into sub-topics."""
    stem = code_of(page)
    parts = stem.split("-")
    # electrical module style: 0670-02, 5126A-01 -> leading module code
    if re.match(r"^\d{3,4}[A-Za-z]?$", parts[0]):
        return parts[0]
    # torque-spec style: 11-01, 24-03 -> leading system number
    # standard style: 23-101 -> 23-1xx ; 34-01 -> 34-0xx
    if len(parts) >= 2 and re.match(r"^\d+$", parts[1]):
        n = parts[1]
        return f"{parts[0]}-{n[0]}xx" if len(n) >= 3 else f"{parts[0]}-0xx"
    return parts[0]


def representative_title(pages: list[dict]) -> str:
    """Pick a concise sub-group name from a band's pages.

    Prefer the first non-index page's first noun phrase; fall back to the most
    common leading words across titles.
    """
    ordered = sorted(pages, key=lambda p: code_of(p))
    for p in ordered:
        t = sanitize(p.get("titel_de") or "")
        if not t:
            continue
        low = t.lower()
        if low.startswith(("inhaltsverzeichnis", "inhaltsübersicht", "übersicht der",
                            "verzeichnis")):
            continue
        return t
    # fallback: most common first two words
    firsts = Counter()
    for p in pages:
        t = sanitize(p.get("titel_de") or "").split()
        if t:
            firsts[" ".join(t[:2])] += 1
    return firsts.most_common(1)[0][0] if firsts else "Weitere Seiten"


def compute_subgroups(pages: list[dict]) -> dict[str, str] | None:
    """Return {band_key: subfolder_name} for a section, or None if not sub-grouped."""
    if len(pages) <= SUBGROUP_THRESHOLD:
        return None
    bands: dict[str, list] = defaultdict(list)
    for p in pages:
        bands[band_key(p)].append(p)
    # tiny bands (1-2 pages) are merged into a shared 'Sonstiges' bucket to avoid
    # a mess of one-page folders in the electrical section.
    mapping: dict[str, str] = {}
    small: list[str] = []
    for key, band_pages in bands.items():
        if len(band_pages) < 3:
            small.append(key)
            continue
        name = fs_safe_dir(f"{representative_title(band_pages)} ({key})", cap=70)
        mapping[key] = name
    for key in small:
        mapping[key] = "Weitere Schaltplaene & Seiten" if any(
            band_key(p) == key and re.match(r"^\d{3,4}", code_of(p)) for p in pages
        ) else "Weitere Seiten"
    return mapping


# ---------------------------------------------------------------- note bodies

def related_block(page: dict) -> str:
    """Render '## Verwandte Seiten' from page['related'] (ordered page_ids)."""
    related = page.get("related") or []
    meta = page.get("related_meta") or {}
    lines = []
    for rid in related:
        rp = PAGE_BY_ID.get(rid)
        if not rp:
            continue
        stem = note_stem(rp)
        m = meta.get(rid) or {}
        shared = ", ".join(m.get("shared") or [])
        sec = sanitize(rp.get("section_no") or "")
        note = f" — {shared}" if shared else ""
        prefix = f"Abschnitt {sec}: " if (m.get("cross") and sec) else ""
        lines.append(f"- [[{stem}]] — {prefix}gemeinsame Begriffe: {shared}"
                     if shared else f"- [[{stem}]]")
    if not lines:
        return ""
    return ("## Verwandte Seiten\n"
            "> [!tip] Automatisch anhand gemeinsamer Fachbegriffe verknüpft.\n\n"
            + "\n".join(lines) + "\n")


def mentioned_block(page: dict) -> str:
    """Render '## Erwähnte Abschnitte' from page['mentioned_sections']."""
    nos = page.get("mentioned_sections") or []
    lines = []
    for no in nos:
        stem = SECTION_MOC_BY_NO.get(no)
        if stem:
            lines.append(f"- [[{stem}|Abschnitt {no}]]")
    if not lines:
        return ""
    return ("## Erwähnte Abschnitte\n"
            "> [!quote] Im Originaltext dieser Seite ausdrücklich genannt.\n\n"
            + "\n".join(lines) + "\n")


def torque_block(page: dict) -> str:
    """Render the dedicated torque<->procedure cross-reference block.

    Two distinct directions (see link_torque_specs.py), rendered with two
    different headings + callouts:
      - on a TORQUE-SPEC page: page['procedure_refs'] -> which jobs need it
      - on a PROCEDURE page:   page['torque_refs']    -> which torque tables it needs
    A page is never both (torque pages live only in the "00 - Torque Specs"
    folder), so only one of the two ever renders per note.
    """
    proc_refs = page.get("procedure_refs")
    if proc_refs is not None:
        if not proc_refs:
            return ""
        lines = [f"- [[{note_stem(PAGE_BY_ID[pid])}]]" for pid in proc_refs if pid in PAGE_BY_ID]
        if not lines:
            return ""
        return ("## Betrifft folgende Arbeitsschritte\n"
                "> [!tip] Seiten, für die dieser Anzugsdrehmoment-Wert benötigt wird.\n\n"
                + "\n".join(lines) + "\n")

    torque_refs = page.get("torque_refs")
    if torque_refs:
        lines = [f"- [[{note_stem(PAGE_BY_ID[tid])}]]" for tid in torque_refs if tid in PAGE_BY_ID]
        if lines:
            return ("## Anzugsdrehmomente\n"
                    "> [!tip] Passende Drehmoment-Tabelle(n) für diesen Arbeitsschritt.\n\n"
                    + "\n".join(lines) + "\n")
    return ""


def build_page_note(page: dict, section_de: str, section_no: str,
                    dest_dir: Path) -> str:
    a = page.get("analysis") or {}
    seitentyp = a.get("seitentyp") or "text"
    typ_de = TYPE_DE.get(seitentyp, seitentyp)
    konf = a.get("konfidenz")
    caption = sanitize(page.get("caption_en") or "").strip()
    titel_de = sanitize(page.get("titel_de") or "").strip()
    code = code_of(page)
    img = page["image_file"]

    # Reference collections (torque-spec supplement, electrical-troubleshooting
    # manual) are single manifest section_folders spanning MANY BMW groups, so
    # the folder-level `section_no` passed in is None. Individual pages there
    # carry their OWN correct group in page["section_no"] (see
    # fix_reference_sections.py) -- used for the frontmatter tag/sektion_nr
    # (so "sektion 34" search also surfaces the matching torque table), but
    # NOT for the "Abschnittsübersicht" footer link or the info callout below,
    # which must keep pointing at the MOC that actually exists on disk (built
    # with the folder-level number).
    tag_section_no = page.get("section_no") or section_no

    tags = [f"sektion/{tag_section_no}", "seite", f"typ/{seitentyp}"]
    if page.get("section_no_note"):
        tags.append("elektrik-referenz" if "Referenzmaterial" in page["section_no_note"]
                    else "pruefen")
    if konf is not None and konf < 0.6:
        tags.append("pruefen")

    fm = [
        "---",
        f'titel: "{esc_yaml(titel_de)}"',
        f'seitencode: "{esc_yaml(code)}"',
        f'sektion_nr: "{esc_yaml(str(tag_section_no))}"',
        f'sektion: "{esc_yaml(section_de)}"',
        f'titel_en: "{esc_yaml(caption)}"',
        f'seitentyp: "{esc_yaml(seitentyp)}"',
        f"konfidenz: {konf if konf is not None else 'null'}",
        f'bilddatei: "{esc_yaml(img)}"',
        "tags:",
    ]
    fm += [f"  - {t}" for t in tags]
    fm.append("---")

    parts = ["\n".join(fm), ""]
    parts.append(f"# {titel_de}")
    parts.append("")
    parts.append(f"> [!info] BMW-Seite `{code}` · Abschnitt {section_no} — {section_de}")
    if tag_section_no and tag_section_no != section_no:
        parts.append(f"> Betrifft BMW-Gruppe **{tag_section_no}**.")
    parts.append(f"> Typ: **{typ_de}**" + (f" · Konfidenz: **{konf:.2f}**" if konf is not None else ""))
    parts.append("> Originalseite oben, deutsche Übersetzung darunter. Die **Originalseite ist maßgeblich**.")
    parts.append("")
    parts.append(f"![[{embed_target(img, dest_dir)}]]")
    parts.append("")
    if caption:
        parts.append(f"*Originaltitel (EN): {caption}*")
        parts.append("")
    parts.append("---")
    parts.append("")
    parts.append("## Beschreibung")
    parts.append(sanitize(a.get("beschreibung")) or "_Keine Beschreibung verfügbar._")
    parts.append("")
    trans = transcription_block(sanitize(a.get("transkription")) or "")
    if trans:
        parts.append("## Transkription")
        parts.append(trans)
        parts.append("")
    tbl = begriffe_table(a.get("begriffe") or [])
    if tbl:
        parts.append("## Fachbegriffe (EN → DE)")
        parts.append(tbl)
        parts.append("")

    tq = torque_block(page)
    if tq:
        parts.append(tq)
        parts.append("")

    if not RENDER_RELATED_SECTIONS or page.get("section_folder") in RENDER_RELATED_SECTIONS:
        ment = mentioned_block(page)
        if ment:
            parts.append(ment)
            parts.append("")
        rel = related_block(page)
        if rel:
            parts.append(rel)
            parts.append("")

    parts.append("---")
    parts.append(f"[[Startseite]] · [[{section_moc_stem(section_no, section_de)}|Abschnittsübersicht]] · [[Glossar]]")
    parts.append("")
    return "\n".join(parts)


def section_moc_stem(section_no: str, section_de: str) -> str:
    # unique per section; e.g. "_Übersicht 34 — Bremsen"
    return fs_safe(f"_Übersicht {section_no} — {section_de}", cap=90)


def build_section_moc(section_de: str, section_no: str, pages: list[dict],
                      subgroups: dict[str, str] | None) -> str:
    fm = [
        "---",
        f'titel: "Übersicht {esc_yaml(section_de)}"',
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
    ]

    def row(p):
        a = p.get("analysis") or {}
        typ = TYPE_DE.get(a.get("seitentyp"), a.get("seitentyp") or "")
        # link without alias: the stem already carries the title, so we avoid
        # escaping a pipe inside a Markdown table cell.
        return f"| `{code_of(p)}` | [[{note_stem(p)}]] | {typ} |"

    if subgroups:
        grouped: dict[str, list] = defaultdict(list)
        for p in pages:
            grouped[subgroups[band_key(p)]].append(p)
        for gname in sorted(grouped, key=lambda g: min(code_of(x) for x in grouped[g])):
            fm.append(f"## {gname}")
            fm.append("")
            fm.append("| Code | Seite | Typ |")
            fm.append("| --- | --- | --- |")
            for p in sorted(grouped[gname], key=code_of):
                fm.append(row(p))
            fm.append("")
    else:
        fm.append("| Code | Seite | Typ |")
        fm.append("| --- | --- | --- |")
        for p in sorted(pages, key=code_of):
            fm.append(row(p))
        fm.append("")

    fm += ["---", "[[Startseite]] · [[Glossar]] · [[Technische-Daten]]", ""]
    return "\n".join(fm)


def build_home(section_order: list[tuple], section_pages: dict) -> str:
    lines = [
        "---",
        'titel: "Startseite"',
        "tags:\n  - startseite",
        "---",
        "",
        "# BMW E30 M3 / 320is — Reparaturhandbuch",
        "",
        "> [!tip] Willkommen!",
        "> Dieses Wissensarchiv enthält das originale BMW-Werkstatthandbuch als **gescannte Seiten**",
        "> mit **deutscher Übersetzung** (Beschreibung, Transkription, Fachbegriffe).",
        "> Nutze die **Suche** (`Strg`+`Umschalt`+`F`) — sie funktioniert auf Deutsch und Englisch.",
        "",
        "## Abschnitte",
        "",
    ]
    for no, de, folder in section_order:
        count = len(section_pages.get(folder, []))
        lines.append(f"- **{no}** · [[{section_moc_stem(no, de)}|{de}]] — {count} Seiten")
    lines += [
        "",
        "## Zusatzmaterial",
        "- [[Bosch Motronic ML 3.1 (Zusatz)]] — Diagnosehandbuch Bosch Motronic ML 3.1",
        "- [[Referenzbilder]] — zusätzliche Referenzzeichnungen",
        "",
        "## Nachschlagen",
        "- [[Glossar]] — zweisprachiges Fachwörterbuch (EN ↔ DE)",
        "- [[Technische-Daten]] — technische Daten M3 / 320is",
        "- [[Sonderwerkzeuge]] — BMW-Spezialwerkzeug-Index mit Seitenverweisen",
        "- [[Sicherheitshinweise]] — Warnhinweise aus dem ganzen Handbuch, nach Abschnitt",
        "- [[LIESMICH]] — Anleitung (Installation, Suche, Zoom)",
        "",
        "> [!note] Hinweis zur Genauigkeit",
        "> Die deutschen Texte wurden automatisch aus den Scans von 1989 erzeugt und dienen der",
        "> **Durchsuchbarkeit und dem Verständnis**. Im Zweifel gilt immer die **Originalseite**.",
        "",
    ]
    return "\n".join(lines)


# A single 5800+ row table in one note is slow to render on Obsidian Mobile.
# Split into these alphabetic ranges (by first character of the EN term),
# sized to be roughly balanced against this vault's actual term distribution
# (heavily skewed toward S/C/R/T/B) rather than a naive even A-Z split.
GLOSSARY_RANGES = [
    ("0–9, A–C", "0", "C"),
    ("D–G", "D", "G"),
    ("H–O", "H", "O"),
    ("P–S", "P", "S"),
    ("T–Z", "T", "Z"),
]


def _glossary_page_stem(label: str) -> str:
    return f"Glossar ({label})"


def _glossary_table_rows(terms: list[dict]) -> list[str]:
    rows = ["| Englisch | Deutsch | Häufigkeit | Varianten |", "| --- | --- | ---: | --- |"]
    for t in terms:
        en = sanitize(t["en"]).replace("|", "\\|")
        de = sanitize(t["de"]).replace("|", "\\|")
        var = sanitize(", ".join(t.get("variants") or [])).replace("|", "\\|")
        star = " ⭐" if t.get("canonical") else ""
        rows.append(f"| {en}{star} | {de} | {t['count']} | {var} |")
    return rows


def write_glossary_notes(glossary: dict) -> None:
    """Write the Glossar.md landing page plus per-range sub-pages (see
    GLOSSARY_RANGES). Regenerable; overwrites all glossary pages each run."""
    terms = sorted(glossary["terms"], key=lambda t: (sanitize(t["en"]).upper(), t["en"]))

    def bucket_of(term: dict) -> int:
        # ASCII ordering conveniently puts digits ('0'-'9', 48-57) below all
        # letters, so they fall into the first ("0", "C") range's lo<=ch<=hi
        # check without any special-casing.
        ch = (sanitize(term["en"])[:1] or "0").upper()
        for i, (_, lo, hi) in enumerate(GLOSSARY_RANGES):
            if lo <= ch <= hi:
                return i
        return len(GLOSSARY_RANGES) - 1

    buckets: dict[int, list[dict]] = defaultdict(list)
    for t in terms:
        buckets[bucket_of(t)].append(t)

    # top 20 most-frequent terms, for a quick-glance table on the landing page
    top = sorted(terms, key=lambda t: -t["count"])[:20]

    landing = [
        "---",
        'titel: "Glossar"',
        "tags:\n  - glossar\n  - nachschlagen",
        "---",
        "",
        "# Glossar — Fachbegriffe EN ↔ DE",
        "",
        f"> [!abstract] {len(terms)} Begriffe, aus allen Seiten zusammengeführt. Aus "
        "Rendering-Gründen (v. a. auf dem Handy) nach Anfangsbuchstabe aufgeteilt:",
        "",
    ]
    for i, (label, _, _) in enumerate(GLOSSARY_RANGES):
        n = len(buckets.get(i, []))
        landing.append(f"- [[{_glossary_page_stem(label)}|{label}]] — {n} Begriffe")
    landing += [
        "",
        "## Häufigste Begriffe",
        "",
        *_glossary_table_rows(top),
        "",
        "⭐ = kuratierter Standardbegriff",
        "",
        "[[Startseite]]",
        "",
    ]
    (REPO / "Glossar.md").write_text("\n".join(landing), encoding="utf-8")

    for i, (label, _, _) in enumerate(GLOSSARY_RANGES):
        page_terms = buckets.get(i, [])
        lines = [
            "---",
            f'titel: "Glossar ({label})"',
            "tags:\n  - glossar",
            "---",
            "",
            f"# Glossar ({label}) — Fachbegriffe EN ↔ DE",
            "",
            f"> [!abstract] {len(page_terms)} Begriffe in diesem Bereich.",
            "",
            *_glossary_table_rows(page_terms),
            "",
            "⭐ = kuratierter Standardbegriff",
            "",
            "[[Glossar|Zurück zur Glossar-Übersicht]] · [[Startseite]]",
            "",
        ]
        (REPO / f"{_glossary_page_stem(label)}.md").write_text("\n".join(lines), encoding="utf-8")


# NOTE: Technische-Daten.md is generated by build_techdata.generate_markdown()
# (imported at the top of this file), NOT from manifest["techspecs"]. That
# flat row-list renderer used to live here but produced invalid markdown
# tables and silently included HTML-commented-out/unconfirmed source rows
# (see git history). build_techdata.py re-parses the original _quellen/*.html
# directly (respecting HTML comments) into proper GFM tables instead.


# ---------------------------------------------------------------- obsidian cfg

def write_obsidian_config():
    OBS.mkdir(parents=True, exist_ok=True)
    (OBS / "app.json").write_text(json.dumps({
        "newFileLocation": "root",
        "alwaysUpdateLinks": True,
        "showUnsupportedFiles": False,
        "attachmentFolderPath": "./",
    }, indent=2), encoding="utf-8")
    (OBS / "core-plugins.json").write_text(json.dumps([
        "file-explorer", "global-search", "switcher", "graph", "backlink",
        "outgoing-link", "tag-pane", "page-preview", "note-composer",
        "command-palette", "outline", "word-count", "file-recovery",
    ], indent=2), encoding="utf-8")
    # Keep this in sync with the plugins actually vendored under
    # .obsidian/plugins/. A full pipeline rebuild rewrites this file, so any
    # enabled plugin missing here would be silently disabled on rebuild.
    #
    # NOTE: "obsidian-image-toolkit" is deliberately NOT listed here (see
    # eda93c9 "fix(obsidian): disable phantom/image plugins"): its plugin
    # folder only ships a pre-seeded data.json (see below), not an actual
    # main.js/manifest.json -- listing it as enabled makes Obsidian try to
    # load a plugin that isn't there and error on startup. Per LIESMICH.md
    # step 5, the user installs it themselves from the community catalog.
    (OBS / "community-plugins.json").write_text(
        json.dumps([
            "hide-image-files",
            "auto-reveal-active-file",
            "show-local-graph",
            "vault-search",
        ], indent=2), encoding="utf-8")
    (OBS / "appearance.json").write_text(json.dumps({
        "readableLineLength": False, "theme": "obsidian",
    }, indent=2), encoding="utf-8")
    # Rebind Ctrl/Cmd+Shift+F from the core global search to the Vault Search
    # plugin. The empty list for "global-search" clears the core default so
    # there is no hotkey conflict (Obsidian ignores a plugin hotkey that
    # collides with an existing core binding).
    (OBS / "hotkeys.json").write_text(json.dumps({
        "global-search": [],
        "vault-search:open-vault-search": [
            {"modifiers": ["Mod", "Shift"], "key": "F"},
        ],
    }, indent=2), encoding="utf-8")
    itk = OBS / "plugins" / "obsidian-image-toolkit"
    itk.mkdir(parents=True, exist_ok=True)
    (itk / "data.json").write_text(json.dumps({
        "viewImageGlobal": True, "viewImageInCPB": True, "viewImageWithLink": True,
        "viewImageOther": True, "imageMoveSpeed": 10, "imgTipToggle": True,
        "imgFullScreenMode": "FIT",
    }, indent=2), encoding="utf-8")


# ---------------------------------------------------------------- moves

def write_reference_index(folder: Path, title: str, desc: str):
    """Create an index note that embeds every image in a reference folder."""
    if not folder.exists():
        return
    imgs = sorted([p for p in folder.iterdir()
                   if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".gif")])
    lines = [
        "---",
        f'titel: "{esc_yaml(title)}"',
        "tags:\n  - zusatzmaterial",
        "---",
        "",
        f"# {title}",
        "",
        f"> [!info] {desc}",
        "",
    ]
    for p in imgs:
        lines.append(f"### {p.stem}")
        lines.append(f"![[{embed_target(p.name, folder)}]]")
        lines.append("")
    lines += ["---", "[[Startseite]]", ""]
    (folder / f"{fs_safe(title)}.md").write_text("\n".join(lines), encoding="utf-8")


def git_mv(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.resolve() == dst.resolve():
        return
    r = subprocess.run(["git", "mv", "-k", str(src), str(dst)],
                       cwd=REPO, capture_output=True, text=True)
    if r.returncode != 0:
        # fall back to a plain move (e.g. file untracked)
        if src.exists():
            src.rename(dst)


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    glossary = json.loads(GLOSSARY.read_text(encoding="utf-8"))
    sections_meta = glossary["sections"]

    section_pages: dict[str, list] = defaultdict(list)
    for p in manifest["pages"]:
        section_pages[p["section_folder"]].append(p)

    # Detect image filenames that appear in more than one page so their embeds
    # can be written as unambiguous vault-relative paths (see embed_target).
    _img_counts = Counter(p["image_file"] for p in manifest["pages"])
    DUP_IMAGE_NAMES.update(n for n, c in _img_counts.items() if c > 1)

    # Populate lookups for related-page / mentioned-section rendering.
    PAGE_BY_ID.update({p["page_id"]: p for p in manifest["pages"]})
    for folder, meta in sections_meta.items():
        no = meta.get("no")
        if not no:
            continue
        # a group number may map to two folders (41 Body / 41 Body Convertibles):
        # prefer the first (non-convertible) so the MOC link is the main section.
        SECTION_MOC_BY_NO.setdefault(str(no), section_moc_stem(no, meta["de"]))
    # RENDER_RELATED_SECTIONS is left empty -> related/mentioned blocks render on
    # every section. Populate it with section folders to restrict rendering (as
    # was done during the pilot phase).

    # section ordering for the home page
    section_order = []
    for folder in section_pages:
        meta = sections_meta.get(folder, {"no": None, "de": folder})
        section_order.append((meta.get("no") or "", meta["de"], folder))
    section_order.sort(key=lambda x: (x[0] or "zzz", x[2]))

    n_notes = n_moved = 0
    stems_seen: set[str] = set()

    for no, de, folder in section_order:
        pages = section_pages[folder]
        sec_dirname = fs_safe_dir(de if not no else f"{no} - {de}", cap=90)
        sec_dir = REPO / sec_dirname
        subgroups = compute_subgroups(pages)

        for p in pages:
            # destination sub-folder
            if subgroups:
                sub = subgroups[band_key(p)]
                dest_dir = sec_dir / sub
            else:
                dest_dir = sec_dir
            dest_dir.mkdir(parents=True, exist_ok=True)

            # 1) move the scan next to its note
            src_img = REPO / p["image_path"]
            dst_img = dest_dir / p["image_file"]
            if src_img.exists():
                git_mv(src_img, dst_img)
                n_moved += 1

            # 2) write the note
            stem = note_stem(p)
            assert stem not in stems_seen, f"dup stem: {stem}"
            stems_seen.add(stem)
            (dest_dir / f"{stem}.md").write_text(
                build_page_note(p, de, no, dest_dir), encoding="utf-8")
            n_notes += 1

        # section MOC at the section root
        (sec_dir / f"{section_moc_stem(no, de)}.md").write_text(
            build_section_moc(de, no, pages, subgroups), encoding="utf-8")

    # NOTE: Bosch Motronic ML 3.1 (Zusatz) is NOT rebuilt via write_reference_index
    # (raw image-only embeds) -- it was vision-analyzed like every other page in
    # the vault (see analyze_bosch_motronic.py) and has its own per-spread notes
    # + index. Re-run `python3 .pipeline/scripts/analyze_bosch_motronic.py --build`
    # to regenerate those notes/index from the cached analysis if needed.
    write_reference_index(
        REPO / "Referenzbilder",
        "Referenzbilder",
        "Zusätzliche Referenzzeichnungen und Übersichtsbilder.",
    )

    (REPO / "Startseite.md").write_text(build_home(section_order, section_pages), encoding="utf-8")
    write_glossary_notes(glossary)
    (REPO / "Technische-Daten.md").write_text(build_techdata.generate_markdown(), encoding="utf-8")
    build_special_tools.main()
    build_safety_notes.main()

    write_obsidian_config()

    print("Vault root:", REPO)
    print(f"  notes written : {n_notes}")
    print(f"  scans moved   : {n_moved}")
    print(f"  sections      : {len(section_order)}")
    print(f"  glossary terms: {len(glossary['terms'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
