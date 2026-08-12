#!/usr/bin/env python3
"""Phase 8 (post-hoc) — Assign correct per-page BMW group numbers to the two
"reference manual" collections that were imported with section_no = null.

Both `00 - Torque Specs` (BMW N 600 02.0 Anzugsdrehmomente supplement) and
`1990 BMW M3 Electrical Troubleshooting Manual` are single manifest
section_folders spanning MANY different BMW repair groups, but every page in
them has `section_no: null`. That means:

  - the generated notes' `sektion_nr` frontmatter / `sektion/NN` tag is blank
    for all 272 of these pages, so the vault's advertised "sektion 34 bremsen"
    search convention (see LIESMICH.md) silently never matches any of them;
  - relate.py's cross-section bonus and mentioned_sections xref-parsing use
    page["section_no"], so it never fires for these pages either.

Fix: derive the *real* BMW group number from each page's own code and write
it back to page["section_no"] (per-page, not per-folder -- build_vault.py's
inner loop must be told to prefer this over the folder-level number; see
`page_section_no` there).

- Torque-spec pages: the code IS the BMW group ("11-01" -> group "11"; the
  German subfolder names already confirm this, e.g. "(11-0xx)").
- Electrical-manual pages: BMW's own SI/wiring-diagram numbering uses the
  circuit code's leading digits as the group number in most cases (e.g.
  "3450-01" ABS -> group "34"; confirmed against this vault's own folder
  titles, e.g. "6413" = Klimaanlage-Gebläse -> matches "64 - Heating and Air
  Conditioning"). A handful of codes are genuine cross-cutting reference
  material (component-location tables, connector pinouts, splice-point
  indexes) that were never assigned a single physical repair group by BMW --
  those are intentionally left unmapped (section_no stays null) and get a
  distinct `elektrik-referenz` tag instead of a guessed/false group number.

Re-runnable / idempotent; writes manifest.json in place.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

PIPE = Path(__file__).resolve().parent.parent
MANIFEST = PIPE / "manifest.json"

TORQUE_FOLDER = "00 - Torque Specs"
ELECTRICAL_FOLDER = "1990 BMW M3 Electrical Troubleshooting Manual"

# Electrical-manual circuit-code prefix -> BMW repair group. Derived from
# BMW's own SI wiring-diagram numbering, cross-checked against this vault's
# German folder titles (e.g. "3450" Antiblockiersystem -> matches "34 - Brakes";
# "6413" Klimakompressor -> matches "64 - Heating and Air Conditioning").
# None = genuine cross-cutting reference material, no single group applies.
ELECTRICAL_GROUP = {
    "0670": "61",   # Stromverteilungskasten / fuse & relay box -> general electrical
    "1230": "12",   # Ladesystem (charging system)
    "1240": "12",   # Zuendanlassschalter (ignition/start switch)
    "1364": "12",   # Motronic-Einspritzanlage S14 (engine electrical/DME)
    "3243": "72",   # Rueckhaltesystem Fahrerairbag (restraint system/airbag)
    "3435": "34",   # Bremswarnsystem (brake warning system)
    "3450": "34",   # Antiblockiersystem (ABS)
    "5116": "51",   # Spiegelverstellung (power mirrors)
    "5126": "51",   # Zentralverriegelung (central locking)
    "5133": "51",   # Fensterheber (power windows)
    "5200": "52",   # Sitzheizung (seat heating)
    "5413": "54",   # Schiebe-Hubdach (sunroof)
    "6100": "61",   # Hupenanlage / Tuerschlossheizung (horn/door lock heating)
    "6131": "61",   # Warnsummer- und Gurtwarnanlage (buzzer/belt warning)
    "6160": "61",   # Scheibenwisch-Waschanlage (wiper/washer)
    "6210": "62",   # Instrumentenkombination (instrument cluster)
    "6216": "62",   # Aktive Check-Control
    "6300": "63",   # Lichtschalter/Beleuchtung
    "6312": "63",   # Fernlicht/Abblendlicht/Nebelscheinwerfer
    "6313": "63",   # Fahrtrichtungsanzeiger/Warnblinkanlage
    "6314": "63",   # Park-/Schluss-/Seitenmarkierungsleuchten
    "6320": "63",   # hintere Begrenzungs-/Kennzeichenleuchten
    "6322": "63",   # Rueckfahrleuchten
    "6325": "63",   # Bremsleuchtenanlage
    "6330": "63",   # Innenbeleuchtung
    "6410": "64",   # Heisswasserregelung Heizung/Klima
    "6411": "64",   # Temperaturregelung Klimaanlage
    "6412": "64",   # Klimaanlagen-Luftverteilung
    "6413": "64",   # Geblaesesteuerung Heizung/Klimaanlage
    "6421": "64",   # Frischluft-Umluftsteuerung
    "6452": "64",   # Klimakompressor-Ansteuerung
    "6454": "64",   # Zusatzluefter Klimaanlage/Motorkuehlung
    "6500": "65",   # Radio/Antenne/Soundsystem
    "6571": "65",   # Geschwindigkeitsregelanlage (cruise control -> Sonderausstattung)
    "6581": "62",   # Bordcomputer (onboard computer -> instruments)
    "7000": None,   # Bauteil-Lageansichten im Motorraum (cross-cutting location views)
    "8000": None,   # Index der Spleissstellen-Ansichten (splice-point index)
    "8500": None,   # Diagnosestecker/Steckverbinder Kontaktbelegung (connector pinouts)
    "9005": None,   # Komponenten-Lokalisierungstabelle (cross-reference table)
}

CODE_PREFIX_RE = re.compile(r"^(\d{2,4})")


def group_for_electrical(image_file: str) -> str | None:
    code = re.sub(r"\.jpg$", "", image_file, flags=re.I)
    m = CODE_PREFIX_RE.match(code)
    if not m:
        return None
    digits = m.group(1)
    if len(digits) == 2:
        return digits  # "00-03" etc -> already a plain BMW group number
    return ELECTRICAL_GROUP.get(digits)


def group_for_torque(image_file: str) -> str | None:
    code = re.sub(r"\.jpg$", "", image_file, flags=re.I)
    m = re.match(r"^(\d{2})-", code)
    return m.group(1) if m else None


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    pages = manifest["pages"]

    n_torque = n_torque_mapped = 0
    n_elec = n_elec_mapped = 0

    for p in pages:
        if p["section_folder"] == TORQUE_FOLDER:
            n_torque += 1
            grp = group_for_torque(p["image_file"])
            if grp:
                p["section_no"] = grp
                n_torque_mapped += 1
            else:
                p["section_no"] = None
                p["section_no_note"] = "kein eindeutiger Abschnitt ermittelbar"
        elif p["section_folder"] == ELECTRICAL_FOLDER:
            n_elec += 1
            grp = group_for_electrical(p["image_file"])
            if grp:
                p["section_no"] = grp
                n_elec_mapped += 1
            else:
                p["section_no"] = None
                p["section_no_note"] = "Referenzmaterial ohne eindeutigen Abschnitt"

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Torque Specs      : {n_torque_mapped}/{n_torque} pages mapped to a group")
    print(f"Electrical Manual : {n_elec_mapped}/{n_elec} pages mapped to a group")
    print(f"manifest.json updated ({MANIFEST})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
