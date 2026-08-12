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


# ---------------------------------------------------------------- translation
# The source tech-spec sheet (_quellen/*.html) is entirely in English. Every
# other note in this vault is German-first with an English caption for
# reference -- Technische-Daten.md standing out as an all-English page was
# reported as inconsistent. These dictionaries translate every label, section
# heading, and descriptive value phrase; part numbers, model codes, and
# fixed spec strings (e.g. "SAE 10W40", "DOT 4", "Dexron III") are left as-is
# since they're not English prose, they're identifiers used the same way in
# German-language BMW documentation.

SECTION_DE = {
    "Introduction": "Einleitung",
    "Chassis & Drivetrain": "Fahrwerk & Antrieb",
    "General": "Allgemein",
    "Engine Electrical": "Motorelektrik",
    "Miscellaneous": "Sonstiges",
}

LABEL_DE = {
    "# cars produced:": "Produzierte Fahrzeuge:",
    "A/C charge (R12):": "Klimaanlagen-Füllmenge (R12):",
    "Acceleration 0-100 km/h:": "Beschleunigung 0–100 km/h:",
    "Air con belt:": "Klimakompressor-Riemen:",
    "Air flow meter:": "Luftmengenmesser:",
    "Alignment (front toe-in):": "Achsvermessung (Vorspur vorne):",
    "Alignment (rear toe-in):": "Achsvermessung (Vorspur hinten):",
    "Alternator belt:": "Generatorriemen:",
    "Alternator:": "Generator:",
    "Axle Ratio (final drive):": "Achsübersetzung (Hinterachsgetriebe):",
    "Battery:": "Batterie:",
    "Bore x Stroke:": "Bohrung x Hub:",
    "Brake / Clutch fluid:": "Brems-/Kupplungsflüssigkeit:",
    "CO % (w/o Cat) at idle:": "CO-Gehalt (ohne Kat.) im Leerlauf:",
    "Catalytic converter:": "Katalysator:",
    "Clutch:": "Kupplung:",
    "Compression Ratio:": "Verdichtungsverhältnis:",
    "Coolant quantity:": "Kühlmittelmenge:",
    "Cooling fan:": "Kühlerlüfter:",
    "Cw (coeff) / Cx (drag area) aerodynamics:": "Cw-Wert / Cx-Wert (Luftwiderstand):",
    "Cylinder head:": "Zylinderkopf:",
    "Differential oil (25% limited slip):": "Differentialöl (25 % Sperrdifferential):",
    "Differential oil quantity:": "Differentialölmenge:",
    "Displacement:": "Hubraum:",
    "Electrode clearance:": "Elektrodenabstand:",
    "Engine Oil:": "Motoröl:",
    "Engine Power Output:": "Motorleistung:",
    "Engine Type:": "Motorbauart:",
    "Engine:": "Motor:",
    "Firing order:": "Zündfolge:",
    "Front Brakes:": "Bremsen vorne:",
    "Front suspension:": "Vorderradaufhängung:",
    "Fuel consumption (DIN litres/100 km):": "Kraftstoffverbrauch (DIN, l/100 km):",
    "Fuel pressure regulator:": "Kraftstoffdruckregler:",
    "Fuel tank capacity:": "Kraftstofftankinhalt:",
    "Fuel:": "Kraftstoff:",
    "Gearbox oil brands: [from forums, 2024]": "Getriebeöl-Marken: [aus Foren, 2024]",
    "Gearbox oil quantity:": "Getriebeölmenge:",
    "Gearbox oil:": "Getriebeöl:",
    "Gearbox ratios:": "Getriebeübersetzungen:",
    "HC at idle:": "HC-Gehalt im Leerlauf:",
    "Idle speed:": "Leerlaufdrehzahl:",
    "Ignition coil:": "Zündspule:",
    "In-tank fuel pump:": "Kraftstoffpumpe (im Tank):",
    "Injection system pressure:": "Einspritzdruck:",
    "Injection:": "Einspritzung:",
    "Injector Specs:": "Einspritzventil-Daten:",
    "Intake vacuum:": "Saugrohrunterdruck:",
    "Length x width x height:": "Länge x Breite x Höhe:",
    "Max Engine Torque:": "Max. Motordrehmoment:",
    "Max rev count (limiter-RPM):": "Max. Drehzahl (Drehzahlbegrenzer):",
    "Max. cylider variance:": "Max. Zylinderabweichung:",
    "Maximum Speed:": "Höchstgeschwindigkeit:",
    "Minimum Disc Thickness (front / rear):": "Mindest-Scheibendicke (vorn / hinten):",
    "Model Code:": "Modellcode:",
    "Motronic DME:": "Motronic-Steuergerät (DME):",
    "Oil cooler, individual capacity:": "Ölkühler, Einzelfassungsvermögen:",
    "Oil filter, individual capacity:": "Ölfilter, Einzelfassungsvermögen:",
    "Oil pressure:": "Öldruck:",
    "Oil quantity (no oil filter change):": "Ölmenge (ohne Filterwechsel):",
    "Oil quantity (with oil filter change):": "Ölmenge (mit Filterwechsel):",
    "Oil temp to not exceed:": "Öltemperatur nicht überschreiten:",
    "Oil temperature:": "Öltemperatur:",
    "Operating oil temp:": "Betriebsöltemperatur:",
    "Permissible Total Weight:": "Zulässiges Gesamtgewicht:",
    "Power steering belt:": "Servolenkungsriemen:",
    "Power steering fluid quantity:": "Servolenkungsflüssigkeit, Menge:",
    "Power steering fluid:": "Servolenkungsflüssigkeit:",
    "Production dates:": "Produktionszeitraum:",
    "Rear Brakes:": "Bremsen hinten:",
    "Rear suspension:": "Hinterradaufhängung:",
    "Spark Plugs:": "Zündkerzen:",
    "Starter motor:": "Anlasser:",
    "Throttle position sensor:": "Drosselklappenpotentiometer:",
    "Timing by:": "Ventilsteuerung durch:",
    "Track (front / rear):": "Spurweite (vorn / hinten):",
    "Transmission:": "Getriebe:",
    "Tyre pressure (front / rear):": "Reifendruck (vorn / hinten):",
    "Valve Operation:": "Ventilsteuerung:",
    "Valve clearance (below 35 °C):": "Ventilspiel (unter 35 °C):",
    "Valve shims:": "Ventilplättchen:",
    "Valves:": "Ventile:",
    "Weight:": "Gewicht:",
    "Wheelbase:": "Radstand:",
    "Wheels & Tires:": "Räder & Reifen:",
    "@ 90 km/h": "bei 90 km/h",
    "@ 120 km/h": "bei 120 km/h",
    "City": "Stadt",
    "Mixed": "Gemischt",
}

# Exact match per <br>-separated value segment (segments carry their own
# trailing punctuation/whitespace from the source -- keys must match exactly).
VALUE_DE = {
    "inline four, longitudinal, watercooled": "Reihenvierzylinder, längs eingebaut, wassergekühlt",
    "4 valves per cylinder, ": "4 Ventile pro Zylinder, ",
    "45° v-shaped, ": "45° V-förmig, ",
    "36.7 mm intake / 31.6 mm exhaust": "36,7 mm Einlass / 31,6 mm Auslass",
    "double roller chain": "Doppelrollenkette",
    "Electrical, two speed only": "Elektrisch, nur zwei Stufen",
    "Single plate dry clutch": "Einscheiben-Trockenkupplung",
    "McPherson struts, ": "McPherson-Federbeine, ",
    "coil springs, ": "Schraubenfedern, ",
    "torsion stabilizer bar, ": "Drehstab-Stabilisator, ",
    "gas pressure shock absorbers": "Gasdruck-Stoßdämpfer",
    "Semi-trailing arm, ": "Schräglenkerachse, ",
    "Minibloc-coil springs, ": "Minibloc-Schraubenfedern, ",
    "MacPherson struts (single joint),": "McPherson-Federbeine (Eingelenk-Ausführung),",
    "coil springs over gas shocks, ": "Schraubenfedern über Gasdruckdämpfern, ",
    "small positive steering roller radius, ": "kleiner positiver Lenkrollradius, ",
    "brake dive compensation, ": "Bremsnickausgleich, ",
    "stabilizer anti-roll bar": "Stabilisator (Anti-Roll-Bar)",
    "Independent wheel suspension on ": "Einzelradaufhängung an ",
    "semi-trailing arms swept back by 15°, ": "um 15° zurückgeschwenkten Schräglenkern, ",
    "dive compensation when accelerating, ": "Nickausgleich bei Beschleunigung, ",
    "seperate coil spring / shock absorbers": "getrennte Schraubenfeder-/Stoßdämpfer-Einheiten",
    "Single piston floating caliper,": "Einkolben-Schwimmsattel,",
    "260 mm vented disc": "260 mm, innenbelüftet",
    "280 mm vented disc": "280 mm, innenbelüftet",
    "258 mm solid disc": "258 mm, massiv",
    "282 mm solid disc": "282 mm, massiv",
    "EU - N/A": "EU – entfällt",
    "US - yes": "US – vorhanden",
    "N/A": "entfällt",
    "Unleaded 98": "Bleifrei 98",
    "(high temps 10W60)": "(bei hohen Temperaturen 10W60)",
    "SAE 90 Transmission": "SAE 90 Getriebeöl",
    "Getrag 265/6 5-speed manual": "Getrag 265/6 Fünfganggetriebe (manuell)",
    "(US spec)": "(US-Ausführung)",
    "Getrag 265/5 dogleg 5-speed manual": "Getrag 265/5 Dogleg-Fünfganggetriebe (manuell)",
    "(European spec)": "(Europa-Ausführung)",
    "(same as European spec E30 M3)": "(baugleich mit europäischer E30-M3-Ausführung)",
    # the variant name is already the row prefix ("**Coupé:**"/"**Cabrio:**"/
    # "**Limousine:**"), so the value itself only needs the body style, not a
    # repeated variant name.
    "Coupe 2-door ": "zweitürig ",
    "Coupe 2-door": "zweitürig",
    "Convertible 2-door ": "zweitürig ",
    "Sedan 4-door": "viertürig",
    "2.5% (Jeroen's recommendation)": "2,5 % (Empfehlung von Jeroen)",
    "880 (+/- 50) rpm": "880 (+/- 50) U/min",
    "0.5 to 2.0 Bar at idle": "0,5 bis 2,0 bar im Leerlauf",
    "7300 rpm": "7300 U/min",
    "BMW shims interchangeable with": "BMW-Plättchen austauschbar mit",
    "Ferrari, Fiat, Lancia and Volvo shims": "Ferrari-, Fiat-, Lancia- und Volvo-Plättchen",
    "Same as E30 316-316iM10-318iM10-M3 ": "Baugleich mit E30 316-316iM10-318iM10-M3 ",
    "Same as E21 316-318-320M10-320i, ": "Baugleich mit E21 316-318-320M10-320i, ",
    "Unique for E30 M3": "Nur für E30 M3",
    "Same as E30 320is": "Baugleich mit E30 320is",
    "Same as E30 316iM40-318iM40-320i, ": "Baugleich mit E30 316iM40-318iM40-320i, ",
    "Same as E30 320i-323i-325e-M3, ": "Baugleich mit E30 320i-323i-325e-M3, ",
    "Same as E30 316iM10-318iM10-325i-M3, ": "Baugleich mit E30 316iM10-318iM10-325i-M3, ",
    "Same as most other BMW’s, ": "Baugleich mit den meisten anderen BMW-Modellen, ",
    "especially E23-E24-E28-E30-E34": "insbesondere E23-E24-E28-E30-E34",
    "Unique for 320iS": "Nur für 320iS",
    "Same as M3": "Baugleich mit M3",
    "Bosch part # / BMW part #": "Bosch-Teilenummer / BMW-Teilenummer",
    "Dogleg 5-speed": "5-Gang (Dogleg)",
    "25% Limited Slip Diff": "25 % Sperrdifferential",
    "6.5×14 cross spoke alloys": "6,5×14 Kreuzspeichen-Leichtmetallräder",
    "6.5×14 bottlecap alloys": "6,5×14 „Bottlecap“-Leichtmetallräder",
    "Oil temp indicator": "Öltemperaturanzeige",
    "PAS": "Servolenkung (PAS)",
    "Central locking": "Zentralverriegelung",
    "M-Tech bodykit": "M-Technic-Karosseriekit",
    "Rear spoiler": "Heckspoiler",
    "Shadowline": "Shadowline-Zierleisten",
    "Map-reading lights": "Kartenleseleuchten",
    "Metallic paintwork": "Metalliclackierung",
    "Sports seats": "Sportsitze",
    "and E28 518iM10": "und E28 518iM10",
    "80 – 120 °C operating temp": "80–120 °C Betriebstemperatur",
    "Do not exceed 130 °C": "130 °C nicht überschreiten",
    "Do not exceed 4000 rpm below 50 °C": "unter 50 °C nicht über 4000 U/min",
    "Jetronic port / 2.4 Ohm": "Jetronic-Einspritzventil / 2,4 Ohm",
    "9.0 litres (9.5 litres with A/C)": "9,0 Liter (9,5 Liter mit Klimaanlage)",
    'alloy 15" x 7J ET 24 / 205/55VR15': 'Leichtmetall 15" x 7J ET 24 / 205/55VR15',
    'alloy 14" x 6.5J ET 30 / 195/65R14H': 'Leichtmetall 14" x 6,5J ET 30 / 195/65R14H',
    'cross spoke 15" x 7J ET 24 / 205/55VR15': 'Kreuzspeiche 15" x 7J ET 24 / 205/55VR15',
}

# Compositional unit/phrase patterns that appear glued onto numeric values
# (so a per-segment exact-dict lookup can't catch them) -- applied as a
# regex cleanup pass over every segment, matched or not.
_UNIT_REGEX_RULES = [
    (re.compile(r"@ (\d+) rpm\b"), r"bei \1 U/min"),
    (re.compile(r"\brpm\b"), "U/min"),
    (re.compile(r"\blitres\b", re.I), "Liter"),
    (re.compile(r"(\d)\s*sec\b"), r"\1 s"),
    (re.compile(r"\(w/ catalyst\)"), "(mit Katalysator)"),
    (re.compile(r"\b(\d+)(?:st|nd|rd|th)\b"), r"\1."),  # "1st"/"2nd"/... -> "1."/"2."/...
    (re.compile(r"\bsynthetic\b", re.I), "synthetisch"),
    (re.compile(r"\bdino\b", re.I), "mineralisch"),
    (re.compile(r"\bsupercedes\b", re.I), "ersetzt"),
]


def _apply_unit_regex(text: str) -> str:
    for pat, repl in _UNIT_REGEX_RULES:
        text = pat.sub(repl, text)
    return text

# English function words that would flag an un-translated segment as
# suspicious (used only for a completeness warning at generation time).
_EN_STOPWORDS = {"the", "and", "with", "for", "of", "at", "on", "in", "is", "are",
                  "same", "unique", "spec", "only"}


def translate_label(label: str) -> str:
    return LABEL_DE.get(label, label)


def translate_value(value: str) -> str:
    """Translate a (possibly <br>-joined, possibly *italic*-wrapped per
    segment) value string. Each segment is looked up in VALUE_DE with its
    emphasis markers stripped, then re-wrapped -- safe to call on an
    already-German string too, since VALUE_DE/LABEL_DE keys are English-only
    and therefore never accidentally match already-translated text."""
    if not value:
        return value
    segments = value.split("<br>")
    out = []
    for seg in segments:
        core, wrap = seg, ""
        if len(seg) > 1 and seg.startswith("*") and seg.endswith("*"):
            core, wrap = seg[1:-1], "*"
        translated = _apply_unit_regex(VALUE_DE.get(core, core))
        out.append(f"{wrap}{translated}{wrap}")
        if core == translated:
            words = re.findall(r"[A-Za-z']+", core)
            if any(w.lower() in _EN_STOPWORDS for w in words):
                print(f"  [build_techdata] WARNUNG: möglicherweise unübersetzt: {seg!r}")
    return "<br>".join(out)


_ROW_RE = re.compile(r"^\| (.*?) \| (.*) \|$")


def translate_table_lines(lines: list[str]) -> list[str]:
    """Translate every '| label | value |' row in a section's rendered
    markdown lines. Header/separator rows pass through unchanged."""
    out = []
    for ln in lines:
        if ln in ("| Merkmal | Wert |", "| --- | --- |"):
            out.append(ln)
            continue
        m = _ROW_RE.match(ln)
        if not m:
            out.append(ln)
            continue
        label, val = m.group(1), m.group(2)
        out.append(f"| {translate_value(label) if label.startswith('*') else translate_label(label)} | {translate_value(val)} |")
    return out


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
                sections.append((SECTION_DE.get(cur_title, cur_title), translate_table_lines(cur_lines)))
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

        # blank-label cross-reference addendum ("Same as ...") -> merge into previous row.
        # values[0] may itself contain internal <br> segments; wrap each one in its
        # own *emphasis* markers (not the whole multi-segment string in one pair) so
        # the later per-segment translate_value() can find and translate each one.
        if not label and len(values) == 1 and cur_lines:
            flush_gearbox()
            addendum = "<br>".join(f"*{seg}*" for seg in values[0].split("<br>"))
            for i in range(len(cur_lines) - 1, -1, -1):
                if cur_lines[i].startswith("|") and not cur_lines[i].startswith("| ---") and not cur_lines[i].startswith("| Merkmal"):
                    cur_lines[i] = cur_lines[i].rstrip(" |") + f"<br>{addendum}" + " |"
                    break
            continue

        flush_gearbox()
        if len(values) >= 2:
            # translate v1/v2 BEFORE wrapping in the variant prefix -- once
            # wrapped, "**Coupé:** Coupe 2-door " is a single <br>-segment
            # that no longer exact-matches any VALUE_DE key.
            v1, v2 = translate_value(values[0]), translate_value(values[1])
            if v1 == v2:
                val = v1
            else:
                val = f"**{variant_names[0]}:** {v1}<br>**{variant_names[1]}:** {v2}"
        elif len(values) == 1:
            val = translate_value(values[0])
        else:
            val = ""
        cur_lines.append(f"| {label} | {val} |")
        last_label_row = r

    flush_gearbox()
    if cur_lines:
        sections.append((SECTION_DE.get(cur_title, cur_title), translate_table_lines(cur_lines)))
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
        a, b = VALUE_DE.get(a, a), VALUE_DE.get(b, b)
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
        ("Coupé", "Cabrio"),
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
        ("Coupé", "Limousine"),
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
