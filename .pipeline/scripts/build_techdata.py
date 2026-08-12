#!/usr/bin/env python3
"""Phase 7 (post-hoc) — Rebuild Technische-Daten.md from the original HTML sources.

The previous hand-conversion of `_quellen/M3-techspec.html` and
`_quellen/320is-techspec.html` into `Technische-Daten.md` produced invalid
markdown tables (bare bold lines instead of table rows) AND ignored HTML
comments in the source, silently including 20 M3 rows (CO%/HC at idle, intake
vacuum, idle speed, oil pressure, front/rear toe-in, the whole "Standard
Equipment" block) that the source author explicitly commented out (i.e. not
confirmed / not applicable for the M3 variant, per the live 320is-only rows).

This script re-parses both HTML files directly (regex-based; the table markup
is simple and static, no need for a full HTML parser dependency), strips HTML
comments FIRST (so commented-out rows are correctly excluded), and emits
clean, valid GFM tables. Re-runnable / regenerable, like the rest of the
pipeline scripts.

Usage:
  python3 .pipeline/scripts/build_techdata.py
"""
from __future__ import annotations

import html as htmlmod
import re
from pathlib import Path

PIPE = Path(__file__).resolve().parent.parent
REPO = PIPE.parent
QUELLEN = PIPE / "_quellen"
OUT = REPO / "Technische-Daten.md"

TR_RE = re.compile(r"<tr\b[^>]*>(.*?)</tr>", re.S | re.I)
TD_RE = re.compile(r"<td\b([^>]*)>(.*?)</td>", re.S | re.I)
H2_RE = re.compile(r"<h2>(.*?)</h2>", re.S | re.I)


def strip_comments(text: str) -> str:
    return re.sub(r"<!--.*?-->", "", text, flags=re.S)


def clean_text(frag: str) -> str:
    """For labels/headers/short values: collapse <br> to a plain space (no
    stray punctuation), strip all tags, unescape entities, collapse whitespace."""
    frag = re.sub(r"<sup>(.*?)</sup>", r"\1", frag, flags=re.S | re.I)
    frag = re.sub(r"<br\s*/?>", " ", frag, flags=re.I)
    frag = re.sub(r"<[^>]+>", "", frag)
    frag = htmlmod.unescape(frag)
    frag = re.sub(r"\s+", " ", frag).strip()
    return frag


def clean_cell(frag: str) -> str:
    """Like clean_text but preserves <br> as literal HTML for multi-line table cells."""
    frag = re.sub(r"<sup>(.*?)</sup>", r"\1", frag, flags=re.S | re.I)
    frag = re.sub(r"<span[^>]*>|</span>", "", frag, flags=re.I)
    frag = re.sub(r"<i>|</i>", "", frag, flags=re.I)
    frag = re.sub(r"<br\s*/?>\s*", "<br>", frag, flags=re.I)
    frag = htmlmod.unescape(frag)
    frag = re.sub(r"(<br>\s*)+$", "", frag)
    frag = re.sub(r"^(<br>\s*)+", "", frag)
    frag = re.sub(r"[ \t]+", " ", frag).strip()
    return frag.replace("|", "\\|")


def parse_rows(html_text: str) -> list[dict]:
    """Return ordered list of {kind: 'header'|'row', ...}."""
    table_m = re.search(r'<table id="techTable">(.*?)</table>', html_text, re.S)
    body = table_m.group(1)
    # Source bug (present in both files, same spots): the "General" and
    # "Miscellaneous" section headers are missing their <tr> opener (a stray
    # </tr> from the previous row is immediately followed by
    # <td><h2>...</h2></td> with no <tr> in between). Browsers silently
    # recover via HTML5 error-correction; our regex-based scan needs an
    # explicit <tr>, so unconditionally prepend one before every header <td>
    # (a harmless no-op double <tr> where one is already present).
    body = re.sub(r"<td><h2>", "<tr><td><h2>", body)
    out = []
    for tr_m in TR_RE.finditer(body):
        row_html = tr_m.group(1)
        tds = TD_RE.findall(row_html)
        if not tds:
            continue
        first_attrs, first_html = tds[0]
        h2 = H2_RE.search(first_html)
        if h2:
            out.append({"kind": "header", "text": clean_text(h2.group(1))})
            continue
        label = clean_text(first_html)
        values = []
        for attrs, val_html in tds[1:]:
            v = clean_cell(val_html)
            if v:
                values.append(v)
        if not label and not values:
            continue
        out.append({"kind": "row", "label": label, "values": values})
    return out


def build_model_sections(rows: list[dict], variant_names: tuple[str, str]) -> list[tuple[str, list[str]]]:
    """Group parsed rows into (section_title, [markdown table lines]) tuples."""
    sections: list[tuple[str, list[str]]] = []
    cur_title = "Allgemein"
    cur_lines: list[str] = []
    last_label_row: dict | None = None
    pending_gearbox: list[str] | None = None

    def flush_gearbox():
        nonlocal pending_gearbox
        if pending_gearbox and cur_lines:
            # last emitted row line should be "Gearbox ratios:" -> rewrite its value
            for i in range(len(cur_lines) - 1, -1, -1):
                if cur_lines[i].startswith("| Gearbox ratios:"):
                    cur_lines[i] = f"| Gearbox ratios: | {'<br>'.join(pending_gearbox)} |"
                    break
        pending_gearbox = None

    for r in rows:
        if r["kind"] == "header":
            flush_gearbox()
            if cur_lines:
                sections.append((cur_title, cur_lines))
            cur_title = r["text"].replace("\n", " ")
            cur_lines = ["| Merkmal | Wert |", "| --- | --- |"]
            last_label_row = None
            continue

        label, values = r["label"], r["values"]

        # "Bosch part # / BMW part #" sub-header row (blank label, single value, no colon)
        if not label and len(values) == 1 and "part #" in values[0]:
            cur_lines.append(f"| *{values[0]}* | |")
            last_label_row = None
            continue

        # Gearbox ratio continuation rows: blank label, one value, immediately after
        # a "Gearbox ratios:" row (or another continuation row)
        if not label and len(values) == 1 and pending_gearbox is not None:
            pending_gearbox.append(values[0])
            continue
        if label.startswith("Gearbox ratios"):
            flush_gearbox()
            pending_gearbox = [values[0]] if values else []
            cur_lines.append(f"| {label} | {values[0] if values else ''} |")
            last_label_row = r
            continue

        # blank-label cross-reference addendum ("Same as ...") -> merge into previous row
        if not label and len(values) == 1 and cur_lines:
            flush_gearbox()
            for i in range(len(cur_lines) - 1, -1, -1):
                if cur_lines[i].startswith("|") and not cur_lines[i].startswith("| ---") and not cur_lines[i].startswith("| Merkmal"):
                    cur_lines[i] = cur_lines[i].rstrip(" |") + f"<br>*{values[0]}*" + " |"
                    break
            continue

        flush_gearbox()
        if len(values) >= 2:
            v1, v2 = values[0], values[1]
            if v1 == v2:
                val = v1
            else:
                val = f"**{variant_names[0]}:** {v1}<br>**{variant_names[1]}:** {v2}"
        elif len(values) == 1:
            val = values[0]
        else:
            val = ""
        cur_lines.append(f"| {label} | {val} |")
        last_label_row = r

    flush_gearbox()
    if cur_lines:
        sections.append((cur_title, cur_lines))
    return sections


def build_standard_equipment_table(html_text: str, variant_names: tuple[str, str]) -> list[str] | None:
    """Standard Equipment is a genuine per-variant feature list (not a shared value),
    parsed separately as a 3-column table. Returns None if the block is absent/commented."""
    body_m = re.search(r'<table id="techTable">(.*?)</table>', html_text, re.S)
    body = body_m.group(1)
    m = re.search(r"<h2>Standard<br>Equipment</h2>(.*?)(?=<h2>|$)", body, re.S)
    if not m:
        return None
    lines = [f"| {variant_names[0]} | {variant_names[1]} |", "| --- | --- |"]
    for tr_m in TR_RE.finditer(m.group(1)):
        tds = TD_RE.findall(tr_m.group(1))
        vals = [clean_text(v) for _, v in tds]
        if len(vals) < 2:
            continue
        # tds are [blank-label, coupe-val, other-val, blank] -> keep the two variant cells
        a = vals[1] if len(vals) > 1 else ""
        b = vals[2] if len(vals) > 2 else ""
        if not a and not b:
            continue
        lines.append(f"| {a or '–'} | {b or '–'} |")
    return lines if len(lines) > 2 else None


def render_model(name: str, html_path: Path, variant_names: tuple[str, str], footnote: str) -> str:
    raw = html_path.read_text(encoding="utf-8")
    clean = strip_comments(raw)
    rows = parse_rows(clean)
    sections = build_model_sections(rows, variant_names)

    out = [f"## {name}\n"]
    for title, lines in sections:
        if title == "Standard\nEquipment" or title.replace(" ", "") == "StandardEquipment":
            continue  # handled separately below, from the *original* (uncommented) HTML
        out.append(f"### {title}")
        out.extend(lines)
        out.append("")

    eq_lines = build_standard_equipment_table(raw, variant_names)  # from raw, comments matter
    # only include if NOT fully commented out in this file
    eq_lines_live = build_standard_equipment_table(clean, variant_names)
    if eq_lines_live:
        out.append("### Serienausstattung")
        out.extend(eq_lines_live)
        out.append("")
    elif eq_lines:
        out.append(
            f"> [!note] Serienausstattung für {name} in der Quelle nicht bestätigt (auskommentiert). "
            f"Nicht dargestellt, um unbestätigte Daten nicht als Fakt zu präsentieren."
        )
        out.append("")

    out.append(f"> [!info]- Quelle & Hinweise ({name})\n> {footnote}\n")
    return "\n".join(out)


def generate_markdown() -> str:
    """Build the full Technische-Daten.md content. Used both by this script's
    CLI and (imported) by build_vault.py, so a full pipeline rebuild does not
    clobber this with the old flat manifest["techspecs"] renderer."""
    m3 = render_model(
        "M3",
        QUELLEN / "M3-techspec.html",
        ("Coupe", "Cabrio"),
        "Tabelle ursprünglich von Jeroens E21-Website übernommen "
        "(https://www.bmwe21.net/?page_id=173) und für den E30 M3 aktualisiert. "
        "Schließt Evo- und andere Sondermodelle aus. Werte zu Leerlauf-CO/HC, "
        "Ansaugkrümmerdruck, Leerlaufdrehzahl, Öldruck und Achsvermessung (Spur) "
        "sind für den M3 in der Quelle auskommentiert (nicht bestätigt) — die "
        "S14-Werte in der 320is-Tabelle unten sind baugleich und dienen als Anhaltspunkt. "
        "Quelle: github.com/disuye/E30-M3-320is",
    )
    is320 = render_model(
        "320is",
        QUELLEN / "320is-techspec.html",
        ("Coupe", "Sedan"),
        "Tabelle ursprünglich von Jeroens E21-Website übernommen "
        "(https://www.bmwe21.net/?page_id=173), mit zusätzlichen Informationen "
        "und Neugliederung. Quelle: github.com/disuye/E30-M3-320is",
    )

    return f"""---
titel: "Technische Daten"
tags:
  - technische-daten
---

# Technische Daten

> [!tip] Hinweis
> Werte stammen aus dem technischen Datenblatt (siehe Quellenangabe je Modell unten),
> nicht aus den Werkstatthandbuch-Scans selbst. Bei Abweichungen gilt die Originalseite
> des jeweiligen Werkstatthandbuch-Abschnitts.

{m3}
---

{is320}
---
[[Startseite]]
"""


def main() -> int:
    doc = generate_markdown()
    OUT.write_text(doc, encoding="utf-8")
    print(f"wrote {OUT} ({len(doc)} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
