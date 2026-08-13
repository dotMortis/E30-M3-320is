/**
 * German and English function words that must never carry search weight
 * or become synonym links on their own.
 * @type {Set<string>}
 */
export const STOPWORDS = new Set([
  "und", "oder", "der", "die", "das", "den", "dem", "des", "ein", "eine",
  "einer", "eines", "einem", "einen", "im", "in", "am", "an", "auf", "aus",
  "bei", "mit", "von", "vor", "zur", "zum", "fuer", "bzw",
  "beziehungsweise", "the", "and", "for", "to", "of", "on", "at",
  "with", "or", "a", "an",
  "hinter", "ueber", "unter", "zwischen", "neben", "durch", "gegen", "ohne",
  "bis", "seit", "waehrend", "wegen", "trotz", "innerhalb", "ausserhalb",
  "oberhalb", "unterhalb", "sowie", "sowohl", "weder", "noch",
  "wie", "was", "wer", "wo", "wann", "warum", "wieso", "weshalb",
  "welche", "welcher", "welches", "welchen", "welchem",
  "ich", "du", "er", "sie", "es", "wir", "ihr",
  "mein", "meine", "meinen", "meinem", "meiner", "meines",
  "dein", "deine", "deinen", "sein", "seine", "seinen",
  "kann", "kannst", "koennen", "muss", "musst", "muessen",
  "soll", "sollst", "sollen", "will", "willst", "wollen",
  "geht", "gehts", "macht", "mache", "machst",
  "nicht", "kein", "keine", "auch", "noch", "schon", "sehr",
  "viel", "viele", "komisch", "einfach", "immer", "gerade",
  "diese", "dieser", "dieses", "diesen", "diesem",
  "hier", "dort", "dann", "beim", "denn", "doch", "mal",
]);
