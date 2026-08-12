#!/usr/bin/env python3
"""
Phase 3 — Translation consistency: build a BMW/automotive EN->DE glossary and
normalise section titles to German.

Inputs : manifest.json (with Phase-2 analysis + begriffe term pairs)
Outputs: glossary.json  — {
             "terms":   [{en, de, count, variants:[...]}...] sorted by frequency,
             "sections":{section_folder: {no, en, de}},
             "canonical": {en_lower: de}   # curated seed used for consistency
         }

The glossary is data-driven (aggregated from every page's begriffe) but anchored
by a curated CANONICAL map so the most important terms never drift. The canonical
German rendering wins whenever an English term matches.
"""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MANIFEST = REPO / "manifest.json"
OUT = REPO / "glossary.json"

# Curated canonical BMW/automotive glossary (authoritative EN->DE).
CANONICAL = {
    "brakes": "Bremsen",
    "brake": "Bremse",
    "brake disc": "Bremsscheibe",
    "brake pad": "Bremsbelag",
    "brake caliper": "Bremssattel",
    "brake shoe": "Bremsbacke",
    "master cylinder": "Hauptbremszylinder",
    "brake booster": "Bremskraftverstärker",
    "camshaft": "Nockenwelle",
    "crankshaft": "Kurbelwelle",
    "crankcase": "Kurbelgehäuse",
    "cylinder head": "Zylinderkopf",
    "piston": "Kolben",
    "connecting rod": "Pleuelstange",
    "flywheel": "Schwungrad",
    "timing chain": "Steuerkette",
    "valve": "Ventil",
    "torque": "Drehmoment",
    "tightening torque": "Anzugsdrehmoment",
    "clutch": "Kupplung",
    "clutch disc": "Kupplungsscheibe",
    "gearbox": "Getriebe",
    "transmission": "Getriebe",
    "manual transmission": "Schaltgetriebe",
    "propeller shaft": "Gelenkwelle",
    "drive shaft": "Antriebswelle",
    "differential": "Differential",
    "front axle": "Vorderachse",
    "rear axle": "Hinterachse",
    "wheel bearing": "Radlager",
    "steering": "Lenkung",
    "shock absorber": "Stoßdämpfer",
    "spring strut": "Federbein",
    "fuel system": "Kraftstoffsystem",
    "fuel pump": "Kraftstoffpumpe",
    "fuel injection": "Kraftstoffeinspritzung",
    "injector": "Einspritzventil",
    "fuel tank": "Kraftstofftank",
    "radiator": "Kühler",
    "coolant": "Kühlmittel",
    "water pump": "Wasserpumpe",
    "thermostat": "Thermostat",
    "exhaust system": "Abgasanlage",
    "exhaust manifold": "Abgaskrümmer",
    "catalytic converter": "Katalysator",
    "battery": "Batterie",
    "alternator": "Lichtmaschine",
    "starter": "Anlasser",
    "spark plug": "Zündkerze",
    "ignition": "Zündung",
    "ignition switch": "Zündanlassschalter",
    "relay": "Relais",
    "fuse": "Sicherung",
    "wiring diagram": "Schaltplan",
    "ground": "Masse",
    "connector": "Stecker",
    "harness": "Kabelbaum",
    "instrument cluster": "Kombiinstrument",
    "speedometer": "Tachometer",
    "tachometer": "Drehzahlmesser",
    "headlight": "Scheinwerfer",
    "tail light": "Rücklicht",
    "turn signal": "Blinker",
    "heating": "Heizung",
    "air conditioning": "Klimaanlage",
    "blower": "Gebläse",
    "body": "Karosserie",
    "door": "Tür",
    "hood": "Motorhaube",
    "sunroof": "Schiebedach",
    "seat": "Sitz",
    "seat belt": "Sicherheitsgurt",
    "bumper": "Stoßstange",
    "windshield": "Windschutzscheibe",
    "wheel": "Rad",
    "tire": "Reifen",
    "pedal": "Pedal",
    "gasket": "Dichtung",
    "seal": "Dichtring",
    "bearing": "Lager",
    "bolt": "Schraube",
    "nut": "Mutter",
    "washer": "Unterlegscheibe",
    "remove and install": "Aus- und Einbau",
    "overhaul": "Überholung",
    "adjust": "Einstellen",
    "replace": "Ersetzen",
    "check": "Prüfen",
    "abs": "ABS",
    "srs": "SRS (Airbag)",
    # corrective anchors for table-header terms that pick up context drift
    "measure": "Maß",
    "unit": "Einheit",
    "type": "Typ",
    "value": "Wert",
}

# Section title EN->DE (curated; covers all folders present).
SECTION_DE = {
    "Maintenance and General Data": "Wartung und allgemeine Daten",
    "Maintenance": "Wartung",
    "Torque Specs": "Anzugsdrehmomente",
    "BMW N 600 02.0 - Torque Specs": "BMW N 600 02.0 - Anzugsdrehmomente",
    "1990 BMW M3 Electrical Troubleshooting Manual": "1990 BMW M3 Elektrik-Fehlersuche-Handbuch",
    "Engine": "Motor",
    "Engine Electrical Equipment": "Motor-Elektrik",
    "Fuel System": "Kraftstoffsystem",
    "Fuel Tank and Lines": "Kraftstofftank und Leitungen",
    "Radiator": "Kühler",
    "Exhaust System": "Abgasanlage",
    "Clutch": "Kupplung",
    "Manual Transmission": "Schaltgetriebe",
    "Gear Shift Mechanism": "Schaltmechanismus",
    "Propellor Shaft": "Gelenkwelle",
    "Propeller Shaft": "Gelenkwelle",
    "Front Axle": "Vorderachse",
    "Rear Axle": "Hinterachse",
    "Brakes": "Bremsen",
    "Pedals": "Pedale",
    "Wheels and Tires": "Räder und Reifen",
    "Body": "Karosserie",
    "Body (Convertibles)": "Karosserie (Cabrio)",
    "Body Equipment": "Karosserieausstattung",
    "Seats": "Sitze",
    "Hood, Sun Roof": "Motorhaube, Schiebedach",
    "Instruments": "Instrumente",
    "Lights": "Beleuchtung",
    "Heating and Air Conditioning": "Heizung und Klimaanlage",
    "Radio and Special Equipment": "Radio und Sonderausstattung",
    "Equipment and Accessories for Body": "Ausstattung und Zubehör für Karosserie",
    "Body Cavity Sealing and Undercoating": "Hohlraumversiegelung und Unterbodenschutz",
}


def norm_en(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip().lower())


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    # aggregate term pairs
    de_counts: dict[str, Counter] = defaultdict(Counter)
    display_en: dict[str, str] = {}
    for page in manifest["pages"]:
        analysis = page.get("analysis") or {}
        for pair in analysis.get("begriffe") or []:
            en = (pair.get("en") or "").strip()
            de = (pair.get("de") or "").strip()
            if not en or not de:
                continue
            key = norm_en(en)
            if not key:
                continue
            de_counts[key][de] += 1
            display_en.setdefault(key, en)

    terms = []
    for key, counter in de_counts.items():
        total = sum(counter.values())
        # canonical wins if present, else most common variant
        if key in CANONICAL:
            de = CANONICAL[key]
        else:
            de = counter.most_common(1)[0][0]
        variants = [v for v, _ in counter.most_common() if v != de]
        terms.append({
            "en": display_en[key],
            "de": de,
            "count": total,
            "variants": variants[:5],
            "canonical": key in CANONICAL,
        })

    # ensure every canonical term appears even if never extracted
    present = {norm_en(t["en"]) for t in terms}
    for key, de in CANONICAL.items():
        if key not in present:
            terms.append({"en": key, "de": de, "count": 0, "variants": [], "canonical": True})

    terms.sort(key=lambda t: (-t["count"], t["en"].lower()))

    # section title map
    sections = {}
    for folder in manifest["meta"]["sections"]:
        # section_no + english title from first matching page
        rec = next((p for p in manifest["pages"] if p["section_folder"] == folder), None)
        en_title = rec["section_title_en"] if rec else folder
        de_title = SECTION_DE.get(en_title, en_title)
        sections[folder] = {
            "no": rec["section_no"] if rec else None,
            "en": en_title,
            "de": de_title,
        }

    glossary = {
        "meta": {
            "term_entries": len(terms),
            "canonical_terms": sum(1 for t in terms if t["canonical"]),
            "source_pairs": sum(t["count"] for t in terms),
        },
        "terms": terms,
        "sections": sections,
        "canonical": CANONICAL,
    }
    OUT.write_text(json.dumps(glossary, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote {OUT.name}")
    print(f"  distinct term entries : {len(terms)}")
    print(f"  canonical anchored    : {glossary['meta']['canonical_terms']}")
    print(f"  source term pairs     : {glossary['meta']['source_pairs']}")
    print(f"  sections mapped        : {len(sections)}")
    print("  top 10 terms:")
    for t in terms[:10]:
        print(f"    {t['en']:<28} -> {t['de']:<28} ({t['count']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
