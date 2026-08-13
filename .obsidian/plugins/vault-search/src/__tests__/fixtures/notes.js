/**
 * notes.js — small synthetic fixture "vault" used by the baseline
 * (golden/characterization) tests and by the later optimization tests.
 * Deliberately NOT real vault content: a handful of made-up notes,
 * shaped exactly like the `docs` objects `SearchEngine._build()` pushes
 * into Orama (see ../../main.js:100 - `{ rowId, notePath, code, titel,
 * titleEn, section, tags, content }`), sized/worded to exercise specific
 * behaviours documented in search.js/german.js:
 *
 *  - FUEL_TITLE / FUEL_TANK_TITLE / FUEL_OVERVIEW mirror search.js's own
 *    documented "13-710" scenario (see conceptCoverage()'s doc-comment):
 *    a page that only INCIDENTALLY mentions a verb in its content body
 *    should not out-rank a page that is genuinely ABOUT that verb, and a
 *    page that just repeats one common word in its title should not beat
 *    a page matching two distinct query concepts once each.
 *  - FUEL_TANK_TITLE's title ("Kraftstofftank aus- und einbauen") is a
 *    literal German compound ("Kraftstofftank") that exercises
 *    decompound()/synthesizeJoinedCompounds() and its own content
 *    contains the literal separable-verb infinitive "einbauen" that
 *    synthesizeSeparableVerbs() should be able to bridge to from a query
 *    like "wie baue ich den tank ein".
 *  - BRAKE_TITLE / BRAKE_MENTION exercise field-boost ordering (title
 *    match must outrank an incidental content-only match for the same
 *    term) - see schema.js's FIELD_BOOST.
 *  - EMPTY_CONTENT exercises snippetFor()'s "no content" / "term not
 *    found" edge cases.
 */

export const FUEL_TITLE = {
  rowId: "01-kraftstoff/13-710.md",
  notePath: "01-kraftstoff/13-710.md",
  code: "13-710",
  titel: "Kraftstoffdruck pruefen",
  titleEn: "Checking fuel pressure",
  section: "Kraftstoffanlage",
  tags: ["kraftstoff"],
  content:
    "Kraftstoffdruck pruefen: Manometer an den Pruefanschluss anschliessen. " +
    "Beim Werkzeug einbauen auf die Dichtungen achten, sonst leckt es. " +
    "Druck ablesen und mit dem Sollwert vergleichen.",
};

export const FUEL_TANK_TITLE = {
  rowId: "01-kraftstoff/13-720.md",
  notePath: "01-kraftstoff/13-720.md",
  code: "13-720",
  titel: "Kraftstofftank aus- und einbauen",
  titleEn: "Fuel tank removal and installation",
  section: "Kraftstoffanlage",
  tags: ["kraftstoff", "tank"],
  content:
    "Kraftstofftank ausbauen: Schrauben loesen, Leitungen trennen, Tank absenken. " +
    "Neuen Tank einbauen: Leitungen anschliessen, Schrauben anziehen.",
};

export const FUEL_OVERVIEW = {
  rowId: "01-kraftstoff/13-005.md",
  notePath: "01-kraftstoff/13-005.md",
  code: "13-005",
  titel: "Kraftstoff Kraftstoffanlage Uebersicht",
  titleEn: "",
  section: "Kraftstoffanlage",
  tags: ["kraftstoff", "kraftstoffanlage"],
  content: "Allgemeine Uebersicht der Kraftstoffanlage und ihrer Bauteile.",
};

export const BRAKE_TITLE = {
  rowId: "02-bremsen/07-100.md",
  notePath: "02-bremsen/07-100.md",
  code: "07-100",
  titel: "Bremse pruefen",
  titleEn: "Checking the brake",
  section: "Bremsanlage",
  tags: ["bremse"],
  content: "Bremsbelaege auf Verschleiss pruefen. Bremsscheiben auf Rillen kontrollieren.",
};

export const BRAKE_MENTION = {
  rowId: "03-sonstiges/99-001.md",
  notePath: "03-sonstiges/99-001.md",
  code: "99-001",
  titel: "Sonstige Hinweise",
  titleEn: "",
  section: "Sonstiges",
  tags: [],
  content: "Verschiedene Hinweise, unter anderem zur bremse und zu anderen Verschleissteilen.",
};

export const EMPTY_CONTENT = {
  rowId: "03-sonstiges/99-002.md",
  notePath: "03-sonstiges/99-002.md",
  code: "99-002",
  titel: "Leere Notiz",
  titleEn: "",
  section: "Sonstiges",
  tags: [],
  content: "",
};

export const ALL_NOTES = [
  FUEL_TITLE,
  FUEL_TANK_TITLE,
  FUEL_OVERVIEW,
  BRAKE_TITLE,
  BRAKE_MENTION,
  EMPTY_CONTENT,
];
