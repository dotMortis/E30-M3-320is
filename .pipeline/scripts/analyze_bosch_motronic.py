#!/usr/bin/env python3
"""Phase 12 (post-hoc) — Vision-analyze the Bosch Motronic ML 3.1 supplement.

Unlike every other page in this vault, the 10 scans in
"Bosch Motronic ML 3.1 (Zusatz)/" never went through analyze.py: they were
just embedded as raw, untranslated Italian images with no description,
transcription, or glossary terms (inconsistent with the rest of the vault),
despite being directly relevant to the 320is's ML3.1 DME (the main manual's
M3 procedures cover the M1.3 system instead).

Each PNG is a microfiche spread containing TWO facing frames (e.g. "01-02.png"
= frames J01 + J02), source language Italian (BMW-5006 fault-finding guide
for the Bosch Motronic ML 3.1 system, BMW M3). This script sends each spread
to the same Zen vision model used by analyze.py, with a prompt adapted for
the Italian source and dual-frame layout, then writes one proper page note
per spread (Beschreibung/Transkription/Fachbegriffe, matching every other
note in the vault) plus a regenerated index note.

Re-runnable / resumable: results cached under
.pipeline/cache/bosch_motronic/<name>.json; completed spreads are skipped.

Usage:
  python3 .pipeline/scripts/analyze_bosch_motronic.py --budget 0.20
  python3 .pipeline/scripts/analyze_bosch_motronic.py --build   # notes only, no API calls
"""
from __future__ import annotations

import argparse
import base64
import json
import re
import sys
from pathlib import Path

PIPE = Path(__file__).resolve().parent.parent
REPO = PIPE.parent
FOLDER = REPO / "Bosch Motronic ML 3.1 (Zusatz)"
CACHE_DIR = PIPE / "cache" / "bosch_motronic"
ENV_FILE = REPO / ".env"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from analyze import call_api, extract_text, load_env, page_cost, parse_json_lenient  # noqa: E402

MODEL = "gpt-5.6-luna"
WORST_CASE_PAGE = 0.004  # two frames per image -> a bit more text than a single manual page

PROMPT = (
    "Du bist ein KFZ-Fachuebersetzer und technischer Redakteur. Das folgende Bild ist "
    "ein Mikrofiche-Ausschnitt aus einem ITALIENISCHEN Diagnosehandbuch (BMW-5006, "
    "Bosch Motronic ML 3.1, BMW E30 M3) und zeigt ZWEI nebeneinanderliegende Seiten "
    "(z. B. Rahmen J01 links und J02 rechts). Analysiere BEIDE Seiten zusammen und "
    "uebersetze den italienischen Inhalt ins Deutsche.\n\n"
    "Gib die Antwort AUSSCHLIESSLICH als eine einzige gueltige JSON-Struktur zurueck "
    "(keine Markdown-Codebloecke, kein Text davor oder danach) mit exakt diesen "
    "Schluesseln:\n"
    '  "titel_de": string     – kurzer deutscher Titel fuer diese Doppelseite (max ~8 Woerter).\n'
    '  "titel_en": string     – kurze englische Uebersetzung des Titels.\n'
    '  "beschreibung": string – ein praeziser deutscher Absatz: was zeigen beide Seiten, wozu dienen sie.\n'
    '  "transkription": string – der italienische Text, ins Deutsche uebertragen (Ueberschriften, '
    "Tabellenwerte, Anweisungen, Warnhinweise). Verwende \\n fuer Zeilenumbrueche. Wenn beide "
    "Seiten inhaltlich getrennt sind, klar mit Zwischenueberschriften (z. B. 'Linke Seite (J01):') trennen.\n"
    '  "begriffe": array      – Liste von Objekten {"en": <englischer Fachbegriff>, '
    '"de": <deutsche Entsprechung>} fuer die wichtigsten technischen Begriffe (Motronic/Diagnose-Fachbegriffe).\n'
    '  "seitentyp": string    – genau einer von: "diagram", "table", "text".\n'
    '  "konfidenz": number    – 0.0 bis 1.0, wie sicher die Analyse ist.\n\n'
    "Sei technisch korrekt und benutze etablierte deutsche KFZ-Diagnose-Terminologie. "
    "Quelle ist italienisch, nicht englisch -- uebersetze direkt Italienisch->Deutsch."
)


def image_data_url(path: Path) -> str:
    mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    raw = path.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:{mime};base64,{b64}"


def build_body(data_url: str) -> bytes:
    payload = {
        "model": MODEL,
        "input": [{
            "role": "user",
            "content": [
                {"type": "input_text", "text": PROMPT},
                {"type": "input_image", "image_url": data_url},
            ],
        }],
    }
    return json.dumps(payload).encode("utf-8")


def cache_path(name: str) -> Path:
    return CACHE_DIR / f"{name}.json"


def run_analysis(budget: float) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    imgs = sorted(FOLDER.glob("*.png"))
    key = load_env()
    running_total = 0.0
    for f in CACHE_DIR.glob("*.json"):
        try:
            running_total += float(json.loads(f.read_text(encoding="utf-8")).get("cost", 0.0))
        except Exception:
            pass

    todo = [p for p in imgs if not cache_path(p.stem).exists()]
    print(f"Spreads total={len(imgs)} done={len(imgs)-len(todo)} pending={len(todo)}")
    print(f"Prior spend: ${running_total:.4f} | budget cap: ${budget:.2f}")

    for img in todo:
        if running_total + WORST_CASE_PAGE > budget:
            print(f"BUDGET GATE: ${running_total:.4f}+{WORST_CASE_PAGE:.4f} would exceed ${budget:.2f}. Stopping.")
            break
        try:
            body = build_body(image_data_url(img))
            resp = call_api(key, body)
        except Exception as e:
            print(f"  FAIL {img.stem}: {e}")
            continue
        text = extract_text(resp)
        parsed = parse_json_lenient(text)
        usage = resp.get("usage", {}) or {}
        cost = page_cost(usage)
        result = {
            "name": img.stem, "model": MODEL, "usage": usage, "cost": cost,
            "ok": parsed is not None, "analysis": parsed,
            "raw_text": None if parsed is not None else text[:2000],
        }
        cache_path(img.stem).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        running_total += cost
        status = "ok" if parsed is not None else "no-json"
        print(f"  {img.stem} {status} in={usage.get('input_tokens',0)} out={usage.get('output_tokens',0)} "
              f"${cost:.4f} cum=${running_total:.4f}")


TYPE_DE = {"diagram": "Diagramm", "table": "Tabelle", "text": "Text"}


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
        en = (p.get("en") or "").strip()
        de = (p.get("de") or "").strip()
        if not en and not de:
            continue
        k = (en.lower(), de.lower())
        if k in seen:
            continue
        seen.add(k)
        rows.append(f"| {en.replace('|', chr(92)+'|')} | {de.replace('|', chr(92)+'|')} |")
    return "\n".join(rows)


def build_note(name: str, a: dict) -> str:
    titel_de = a.get("titel_de") or name
    titel_en = a.get("titel_en") or ""
    seitentyp = a.get("seitentyp") or "text"
    typ_de = TYPE_DE.get(seitentyp, seitentyp)
    konf = a.get("konfidenz")

    fm = [
        "---",
        f'titel: "{esc_yaml(titel_de)}"',
        f'seitencode: "{esc_yaml(name)}"',
        f'sektion: "Bosch Motronic ML 3.1 (Zusatz)"',
        f'titel_en: "{esc_yaml(titel_en)}"',
        f'seitentyp: "{esc_yaml(seitentyp)}"',
        f"konfidenz: {konf if konf is not None else 'null'}",
        f'bilddatei: "{esc_yaml(name)}.png"',
        "tags:\n  - zusatzmaterial\n  - bosch-motronic\n  - sektion/12\n  - sektion/13",
        "---",
        "",
        f"# {titel_de}",
        "",
        f"> [!info] Bosch Motronic ML 3.1 Diagnosehandbuch (BMW-5006) · Rahmen `{name}`",
        "> Original: **Italienisch** · Typ: **" + typ_de + "**"
        + (f" · Konfidenz: **{konf:.2f}**" if konf is not None else ""),
        "> Ergänzendes Material, nicht Teil des BMW-Werkstatthandbuchs. "
        "Die **Originalseite ist maßgeblich**.",
        "",
        f"![[{name}.png]]",
        "",
    ]
    if titel_en:
        fm.append(f"*Original title (EN): {titel_en}*")
        fm.append("")
    fm.append("---")
    fm.append("")
    fm.append("## Beschreibung")
    fm.append(a.get("beschreibung") or "_Keine Beschreibung verfügbar._")
    fm.append("")
    trans = transcription_block(a.get("transkription") or "")
    if trans:
        fm.append("## Transkription")
        fm.append(trans)
        fm.append("")
    tbl = begriffe_table(a.get("begriffe") or [])
    if tbl:
        fm.append("## Fachbegriffe (EN → DE)")
        fm.append(tbl)
        fm.append("")
    fm += ["---", "[[Bosch Motronic ML 3.1 (Zusatz)]] · [[Startseite]] · [[Glossar]]", ""]
    return "\n".join(fm)


def build_notes_and_index() -> int:
    imgs = sorted(FOLDER.glob("*.png"))
    n_written = 0
    index_lines = [
        "---",
        'titel: "Bosch Motronic ML 3.1 (Zusatz)"',
        "tags:\n  - zusatzmaterial",
        "---",
        "",
        "# Bosch Motronic ML 3.1 (Zusatz)",
        "",
        "> [!info] Diagnosehandbuch der Bosch-Motronic-ML-3.1-Einspritzanlage (BMW-5006, "
        "Original italienisch). Ergänzendes Material, nicht Teil des BMW-Werkstatthandbuchs. "
        "Jede Doppelseite wurde einzeln analysiert und ins Deutsche übertragen "
        "(siehe jeweilige Seite für Transkription und Fachbegriffe).",
        "",
        "| Rahmen | Seite |",
        "| --- | --- |",
    ]
    for img in imgs:
        cp = cache_path(img.stem)
        if not cp.exists():
            print(f"  skip {img.stem}: no cached analysis (run without --build first)")
            continue
        result = json.loads(cp.read_text(encoding="utf-8"))
        a = result.get("analysis") or {}
        if not a:
            print(f"  skip {img.stem}: analysis failed, see cache")
            continue
        titel_de = a.get("titel_de") or img.stem
        note_name = f"{img.stem} — {titel_de}".replace("/", "-")
        note_path = FOLDER / f"{note_name}.md"
        note_path.write_text(build_note(img.stem, a), encoding="utf-8")
        index_lines.append(f"| `{img.stem}` | [[{note_name}]] |")
        n_written += 1

    index_lines += ["", "---", "[[Startseite]]", ""]
    (FOLDER / "Bosch Motronic ML 3.1 (Zusatz).md").write_text("\n".join(index_lines), encoding="utf-8")
    print(f"wrote {n_written} page notes + index")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--budget", type=float, default=0.20)
    ap.add_argument("--build", action="store_true", help="only (re)build notes from cache, no API calls")
    args = ap.parse_args()
    if not args.build:
        run_analysis(args.budget)
    return build_notes_and_index()


if __name__ == "__main__":
    raise SystemExit(main())
