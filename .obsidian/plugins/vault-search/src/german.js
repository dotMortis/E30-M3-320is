/**
 * german.js — shared German text-normalisation / query-expansion utilities
 * for vault-search's Orama-backed engine (see .pipeline/rag/PLAN.md's
 * "Stage 2" notes). Pure functions only, no `obsidian` import, no Orama
 * import — this module has zero framework/library dependencies so it can
 * be unit-tested standalone (see the Node harness used for benchmarking).
 *
 * Most of fold()/tokenize()/decompound() is carried over unchanged from the
 * original hand-rolled vault-search engine (v1) — that part was already
 * solid and is kept verbatim. What's NEW in this module, added specifically
 * to address the "finds content and paths more easily regardless of typos
 * and spaces" ask:
 *
 *   - STOPWORDS now includes interrogatives/pronouns (wie, was, ich, kann...)
 *     that were previously missing — confirmed via benchmarking to be
 *     polluting BM25-style scoring (a query like "wie baue ich..." let "wie"
 *     count as a real, unfiltered search term, diluting relevance).
 *   - synthesizeSeparableVerbs(): German separable-prefix verbs split apart
 *     in normal sentences ("ich baue den Tank EIN" for "einbauen"). Neither
 *     Orama's stemmer nor the original decompounder bridges this (the
 *     decompounder deliberately refuses to split off verb prefixes, to
 *     avoid nonsense splits like "aus"+"bau"). This adds QUERY-SIDE-ONLY
 *     synthesized candidate terms (prefix+verb-stem+"en") so a query
 *     containing both a separable prefix and a verb-like word gets an extra
 *     chance to match the document's literal infinitive ("einbauen").
 *     Confirmed effective in benchmarking (recovers "tank_einbau").
 *   - synthesizeJoinedCompounds(): the original decompounder only went one
 *     direction (split a long typed compound into parts to match documents
 *     that spell it as separate words). This adds the REVERSE direction:
 *     when the user types a compound as multiple words ("kraftstoff tank"),
 *     synthesize the joined form ("kraftstofftank") as an extra candidate
 *     term so it matches documents that spell it as one word — the other
 *     half of "regardless of typos and spaces".
 */

// ---------------------------------------------------------------- constants

// Hand-curated colloquial <-> manual-term bridges. The auto-extracted glossary
// does not contain these everyday synonyms, but users type them all the time.
// Keys and values are lowercased German. Expansion is bidirectional.
export const COLLOQUIAL_GROUPS = [
  ["benzin", "sprit", "treibstoff", "kraftstoff", "gasoline", "fuel"],
  ["auspuff", "abgasanlage", "schalldaempfer", "exhaust"],
  ["blinker", "fahrtrichtungsanzeiger", "richtungsanzeiger"],
  ["scheibenwischer", "wischer", "scheibenwischanlage"],
  ["kupplung", "clutch"],
  ["getriebe", "schaltgetriebe", "gearbox", "transmission"],
  ["stossdaempfer", "daempfer", "federbein", "shock"],
  ["zuendkerze", "kerze", "spark plug"],
  ["batterie", "akku", "battery"],
  ["kuehler", "kuehlung", "radiator", "cooling"],
  ["lichtmaschine", "generator", "alternator"],
  ["anlasser", "starter"],
  ["reifen", "raeder", "rad", "tire", "wheel"],
  ["bremse", "bremsen", "brake"],
  ["scheinwerfer", "licht", "beleuchtung", "lampe", "headlight", "light"],
  ["tuere", "tuer", "tueren", "door"],
  ["sitz", "sitze", "seat"],
  ["tank", "kraftstofftank", "kraftstoffbehaelter", "fuel tank"],
  // NEW (found via Stage 2 benchmarking, see PLAN.md): the manual exclusively
  // uses "Antriebsriemen" for what everyday German calls "Keilriemen" - it
  // never once uses the word "Keilriemen" itself, confirmed by grepping the
  // relevant pages. Without this link, no amount of typo tolerance or
  // decompounding bridges the gap (they're simply different words).
  // NOTE: deliberately no English/hyphenated entries here (e.g. "v-belt") -
  // Orama's own tokenizer splits on hyphens (SPLITTERS.german in
  // @orama/orama treats "-" as a separator, unlike our tokenize() which
  // preserves it for note codes), so a hyphenated synonym silently becomes
  // two separate single-token search terms at query time. This exact bug
  // was caught during Stage 2 benchmarking: "v-belt" became bare "v",
  // matching hundreds of unrelated pages via single-letter measurement
  // labels like `„V" Einlassventil: 36,6mm`.
  ["keilriemen", "antriebsriemen", "riemen"],
];

// German + English function words that must never become synonym links or
// carry meaningful weight on their own. EXTENDED (see module docstring) to
// include interrogatives, personal pronouns and modal verbs that were
// missing from v1 and confirmed (via benchmarking) to pollute scoring.
export const STOPWORDS = new Set([
  "und", "oder", "der", "die", "das", "den", "dem", "des", "ein", "eine",
  "einer", "eines", "einem", "einen", "im", "in", "am", "an", "auf", "aus",
  "bei", "mit", "von", "vor", "zur", "zum", "fuer", "bzw",
  "beziehungsweise", "the", "and", "for", "to", "of", "on", "at",
  "with", "or", "a", "an",
  // German prepositions - CRITICAL (see orama-schema.ts's own note on the
  // RAG side): without these, a bare preposition like "hinter" (behind)
  // prefix/substring-matches every "Hinterachse..." (rear axle) page and
  // badly pollutes scoring for perfectly ordinary sentences. Confirmed via
  // benchmarking to also cause nonsense synthesized-join candidates (see
  // synthesizeJoinedCompounds) when left unfiltered.
  "hinter", "ueber", "unter", "zwischen", "neben", "durch", "gegen", "ohne",
  "bis", "seit", "waehrend", "wegen", "trotz", "innerhalb", "ausserhalb",
  "oberhalb", "unterhalb", "sowie", "sowohl", "weder", "noch",
  // interrogatives
  "wie", "was", "wer", "wo", "wann", "warum", "wieso", "weshalb",
  "welche", "welcher", "welches", "welchen", "welchem",
  // personal pronouns / possessives
  "ich", "du", "er", "sie", "es", "wir", "ihr",
  "mein", "meine", "meinen", "meinem", "meiner", "meines",
  "dein", "deine", "deinen", "sein", "seine", "seinen",
  // modal / auxiliary verbs and other high-frequency filler words
  "kann", "kannst", "koennen", "muss", "musst", "muessen",
  "soll", "sollst", "sollen", "will", "willst", "wollen",
  "geht", "gehts", "macht", "mache", "machst",
  "nicht", "kein", "keine", "auch", "noch", "schon", "sehr",
  "viel", "viele", "komisch", "einfach", "immer", "gerade",
  "diese", "dieser", "dieses", "diesen", "diesem",
  "hier", "dort", "dann", "beim", "denn", "doch", "mal",
]);

// Separable-verb / generic prefixes that must never be accepted as the
// left-most part of a NOUN compound split (stops "Ausbau" from being
// proposed as "aus" + "bau"). Also doubles as the prefix list used by
// synthesizeSeparableVerbs() below (folded).
export const SPLIT_PREFIX_DENY = new Set([
  "aus", "ein", "um", "an", "ab", "auf", "vor", "nach", "zu", "bei", "mit",
  "durch", "ueber", "unter", "be", "ver", "ent", "er", "ge", "zer", "wieder",
]);

// German linking elements (Fugenelemente) that may sit between two compound
// parts, e.g. Anzug + s + Drehmoment. Tried longest-first. Folded (no umlauts).
export const FUGEN = ["ens", "ns", "es", "en", "s", "n", ""];

// Compound decompounding tunables.
export const MIN_PART_LEN = 4; // a split part must be at least this long
export const MIN_TOKEN_TO_SPLIT = 8; // only attempt to split tokens this long or longer
export const MAX_PARTS = 3; // recursion cap: at most this many parts

// -------------------------------------------------------------------- fold/tokenize

// Normalise for matching. German umlauts/ß are expanded to their standard
// ASCII digraphs (ü->ue, ö->oe, ä->ae, ß->ss) BEFORE stripping any remaining
// diacritics. Consistent on both index and query side.
export function fold(s) {
  return (s || "")
    .toLowerCase()
    .replace(/ü/g, "ue")
    .replace(/ö/g, "oe")
    .replace(/ä/g, "ae")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Split arbitrary text into searchable tokens. Keeps note codes like 16-02
// together, otherwise splits on non-alphanumeric.
export function tokenize(text) {
  if (!text) return [];
  const folded = fold(text);
  const out = [];
  const re = /[a-z0-9]+(?:-[a-z0-9]+)*/g;
  let m;
  while ((m = re.exec(folded)) !== null) {
    out.push(m[0]);
  }
  return out;
}

/** Content words only: tokenize() + drop stopwords + drop anything shorter
 * than 3 chars (too short to be a meaningful search/join candidate). */
export function contentTokens(text) {
  return tokenize(text).filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/** Strip frontmatter and light markdown so the content field is plain-ish
 * text, both for indexing (Orama's `content` field) and for snippet
 * building. Verbatim from v1. */
export function stripForContent(raw) {
  let text = raw;
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const after = text.indexOf("\n", end + 1);
      text = after !== -1 ? text.slice(after + 1) : "";
    }
  }
  text = text
    .replace(/!\[\[[^\]]*\]\]/g, " ")
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
    .replace(/[#>*_`|]/g, " ");
  return text;
}

// -------------------------------------------------------------- decompounding

// Return the dictionary base form of `w`: `w` itself if known, otherwise a
// lightly de-inflected form (stripping a trailing plural/case ending) if THAT
// is known, e.g. "scheiben" -> "scheibe", "ventile" -> "ventil". Returns null
// if neither is in the dictionary.
function dictBase(w, dict) {
  if (dict.has(w)) return w;
  for (const suf of ["en", "e", "n", "s"]) {
    if (w.length - suf.length >= MIN_PART_LEN && w.endsWith(suf)) {
      const stem = w.slice(0, w.length - suf.length);
      if (dict.has(stem)) return stem;
    }
  }
  return null;
}

// Recursively split a (folded) compound token into dictionary words, allowing
// German linking elements between parts. Returns an array of NORMALISED parts
// (each mapped to its dictionary base form) of length >= 2, or null if no
// clean split is found. `dict` is a Set of folded known words (see
// buildDictionary below). Verbatim from v1 — this part was already solid.
export function decompound(token, dict, depth = MAX_PARTS - 1) {
  if (token.length < MIN_TOKEN_TO_SPLIT) return null;
  if (depth <= 0) return null;

  let best = null;
  for (let i = MIN_PART_LEN; i <= token.length - MIN_PART_LEN; i++) {
    const left = token.slice(0, i);
    if (left.length < MIN_PART_LEN) continue;
    if (!dict.has(left)) continue;
    if (SPLIT_PREFIX_DENY.has(left)) continue; // never split off a verb prefix

    for (const fug of FUGEN) {
      const rest = token.slice(i + fug.length);
      if (rest.length < MIN_PART_LEN) continue;
      if (token.slice(i, i + fug.length) !== fug) continue;

      let parts = null;
      const restBase = dictBase(rest, dict);
      if (restBase) {
        parts = [left, restBase];
      } else if (depth > 1) {
        const sub = decompound(rest, dict, depth - 1);
        if (sub) parts = [left, ...sub];
      }
      if (!parts) continue;
      if (parts.length > MAX_PARTS) continue;

      const minLen = Math.min(...parts.map((p) => p.length));
      if (!best || parts.length < best.parts.length || (parts.length === best.parts.length && minLen > best.minLen)) {
        best = { parts, minLen };
      }
    }
  }
  return best ? best.parts : null;
}

// ------------------------------------------------- NEW: query-side synthesis

/**
 * Bridges German separable-prefix verbs split apart in normal sentences.
 * "wie baue ich den Tank EIN" never contains the literal token "einbauen"
 * that the manual uses — but it DOES contain a bare prefix token ("ein")
 * and a verb-looking content word ("baue"). For every (prefix, verbish word)
 * pair found anywhere in the query, synthesize plausible infinitive
 * candidates by joining prefix+stem+"en", trying a couple of common stem
 * normalisations (present-tense "e"/"st"/"t" endings -> infinitive "en").
 *
 * Deliberately permissive and query-side ONLY (never applied at index time,
 * where the real infinitives are already present as literal tokens) — a
 * few spurious candidates that don't exist in the vocabulary are harmless
 * (Orama just won't find them), but recovering the real bridge (e.g.
 * "baue"+"ein" -> "einbauen") is a significant, confirmed recall win.
 *
 * Returns an array of synthesized candidate strings (may be empty).
 * `vocabulary` (a Set of real folded tokens seen in the corpus) GATES the
 * output — see module docstring: without validation, this generates many
 * ungrounded candidate strings (e.g. every prefix x every stem guess) that
 * pollute the search term rather than helping it. Only candidates that
 * actually exist in the corpus are returned.
 */
export function synthesizeSeparableVerbs(queryTokens, vocabulary) {
  const prefixes = queryTokens.filter((t) => SPLIT_PREFIX_DENY.has(t));
  if (prefixes.length === 0) return [];

  const verbish = queryTokens.filter((t) => t.length >= 3 && !SPLIT_PREFIX_DENY.has(t) && !STOPWORDS.has(t));
  const candidates = new Set();

  for (const prefix of prefixes) {
    for (const word of verbish) {
      for (const stem of verbStemCandidates(word)) {
        const candidate = prefix + stem + "en";
        if (vocabulary.has(candidate)) candidates.add(candidate);
      }
    }
  }
  return [...candidates];
}

/** Guesses at the bare stem of a conjugated German verb, from its most
 * common present-tense endings, so synthesizeSeparableVerbs can rebuild an
 * infinitive. E.g. "baue" -> "bau", "ziehst" -> "zieh", "schraubt" -> "schraub".
 * Also returns the word itself unchanged (covers words already close to a
 * stem, e.g. nouns used loosely, cheap to include). Exported so
 * expandQueryConcepts (below) can reuse it to attribute a synthesized
 * separable-verb candidate back to the concept it came from. */
export function verbStemCandidates(word) {
  const stems = new Set([word]);
  for (const suf of ["est", "st", "et", "en", "e", "t"]) {
    if (word.length - suf.length >= 3 && word.endsWith(suf)) {
      stems.add(word.slice(0, word.length - suf.length));
    }
  }
  return stems;
}

/**
 * The reverse direction of decompound(): when the user types a compound as
 * SEPARATE words ("kraftstoff tank"), synthesize the joined form
 * ("kraftstofftank") as an extra candidate term, trying each German linking
 * element (Fugenelement) between adjacent pairs. Only joins ADJACENT
 * content words (skips stopwords already filtered out by the caller) to
 * keep the candidate set small. This is what makes "regardless of ...
 * spaces" work in the write-it-as-two-words direction, mirroring what
 * decompound() already does in the split direction. `vocabulary` GATES the
 * output (see synthesizeSeparableVerbs's docstring for why) — only joins
 * that actually exist in the corpus are returned.
 */
export function synthesizeJoinedCompounds(contentWordsInOrder, vocabulary) {
  const candidates = new Set();
  for (let i = 0; i < contentWordsInOrder.length - 1; i++) {
    const a = contentWordsInOrder[i];
    const b = contentWordsInOrder[i + 1];
    if (a.length < MIN_PART_LEN || b.length < MIN_PART_LEN) continue;
    for (const fug of FUGEN) {
      const candidate = a + fug + b;
      if (vocabulary.has(candidate)) candidates.add(candidate);
    }
  }
  return [...candidates];
}

// ------------------------------------------------------------- synonyms

/**
 * Builds a bidirectional token -> Set(synonym tokens) map from the
 * colloquial groups plus (optionally) a committed glossary.json's
 * `{terms: [{de, en, variants}]}` shape, plus (optionally) a list of
 * [a, b] pairs already filtered down from OpenThesaurus to this vault's
 * vocabulary (see data/synonyms.json, generated by scripts/build-data.mjs —
 * general-language German synonym coverage, e.g. Sprit<->Kraftstoff,
 * complementing the hand-curated COLLOQUIAL_GROUPS' domain-specific bridges
 * like Keilriemen<->Antriebsriemen that a general thesaurus wouldn't have).
 * All inputs are plain data (no I/O here) so this stays a pure function —
 * callers do the vault read / bundle the JSON.
 */
export function buildSynonymMap(glossaryTerms, openThesaurusPairs) {
  const synonyms = new Map();
  const add = (a, b) => {
    const fa = fold(a);
    const fb = fold(b);
    if (!fa || !fb || fa === fb) return;
    if (fa.length < 3 || fb.length < 3) return;
    if (STOPWORDS.has(fa) || STOPWORDS.has(fb)) return;
    if (!synonyms.has(fa)) synonyms.set(fa, new Set());
    synonyms.get(fa).add(fb);
  };

  const singleTokenOf = (phrase) => {
    const toks = tokenize(phrase).filter((t) => !STOPWORDS.has(t) && t.length >= 3);
    return toks.length === 1 ? toks[0] : null;
  };
  const linkColloquial = (a, b) => {
    const ta = singleTokenOf(a);
    const tb = singleTokenOf(b);
    if (ta && tb) {
      add(ta, tb);
      add(tb, ta);
    }
  };
  const linkGlossary = (a, b) => {
    const ta = tokenize(a);
    const tb = tokenize(b);
    if (ta.length === 1 && tb.length === 1) {
      add(ta[0], tb[0]);
      add(tb[0], ta[0]);
    }
  };

  for (const group of COLLOQUIAL_GROUPS) {
    for (let i = 0; i < group.length; i++) {
      for (let j = 0; j < group.length; j++) {
        if (i !== j) linkColloquial(group[i], group[j]);
      }
    }
  }

  for (const t of glossaryTerms || []) {
    const de = t.de || "";
    const en = t.en || "";
    const variants = Array.isArray(t.variants) ? t.variants : [];
    if (de && en) linkGlossary(de, en);
    for (const v of variants) {
      if (de) linkGlossary(de, v);
      if (en) linkGlossary(en, v);
    }
  }

  // OpenThesaurus pairs are already folded, single-word, and pre-filtered
  // (see build-data.mjs) - link directly, bypassing the phrase-splitting
  // logic above (which is for raw multi-word glossary/colloquial entries).
  for (const [a, b] of openThesaurusPairs || []) {
    add(a, b);
    add(b, a);
  }

  return synonyms;
}

export function expandSynonyms(synonymMap, tok) {
  const set = synonymMap.get(tok);
  return set ? [...set] : [];
}

/**
 * Builds the trusted dictionary used by decompound(): high-signal words
 * only (title + tags across the corpus, plus every synonym-map key), NOT
 * raw content, to avoid OCR-garbage splits. Pure function over pre-tokenized
 * title/tag word lists.
 */
export function buildDictionary(titleAndTagTokenLists, synonymMap) {
  const dict = new Set();
  const addDict = (tok) => {
    if (tok.length < MIN_PART_LEN) return;
    if (STOPWORDS.has(tok)) return;
    dict.add(tok);
  };
  for (const tokens of titleAndTagTokenLists) {
    for (const t of tokens) addDict(t);
  }
  for (const [w] of synonymMap) addDict(w);
  return dict;
}

/**
 * Full query-time expansion pipeline: raw query string -> a deduplicated,
 * expanded list of search terms fed to Orama as one search string (joined
 * with spaces — Orama's fulltext search ORs/scores individual terms itself).
 * Combines: literal tokens, colloquial/glossary synonyms, decompound parts
 * (split direction), separable-verb synthesis, and joined-compound synthesis
 * (join direction) — the last two are the NEW pieces added for Stage 2.
 */
export function expandQuery(rawQuery, synonymMap, dict, vocabulary, compoundParts) {
  const allTokens = tokenize(rawQuery);
  const content = allTokens.filter((t) => !STOPWORDS.has(t));
  const expanded = new Set(content);
  const vocab = vocabulary || new Set();
  const precomputed = compoundParts || {};

  for (const tok of content) {
    const synonyms = expandSynonyms(synonymMap, tok);
    for (const syn of synonyms) expanded.add(syn);
    // Only fall back to decompounding when no direct (curated) synonym was
    // found for this token — a synonym is higher-confidence than an
    // automatic split, and NOT skipping this caused a real regression
    // during benchmarking: linking "keilriemen"<->"riemen" as a synonym
    // (to bridge the manual's "Antriebsriemen" wording) also registered
    // "riemen" as a trusted dict word, which newly enabled decompounding
    // "keilriemen" into "keil"+"riemen" — and bare "keil" ("wedge/key",
    // also the root of "Ventilkeil"/valve keeper) is generic enough to
    // spike the wrong documents to the top. See PLAN.md's Stage 2 notes.
    if (synonyms.length === 0) {
      // Prefer the build-time precomputed split (validated against the full
      // 1.6M-word all-the-german-words dictionary, far more accurate than
      // the narrow runtime `dict` built only from this vault's own title/tag
      // words — see build-data.mjs) when this exact token was seen in the
      // vault; fall back to the live algorithm for novel query-only tokens.
      const parts = precomputed[tok] || decompound(tok, dict);
      if (parts) for (const p of parts) expanded.add(p);
    }
  }

  for (const v of synthesizeSeparableVerbs(allTokens, vocab)) expanded.add(v);
  for (const v of synthesizeJoinedCompounds(content, vocab)) expanded.add(v);

  return [...expanded];
}

/**
 * Like expandQuery(), but groups the expansion by originating query
 * "concept" instead of flattening it into one bag of terms. A concept is
 * one meaningful (>= 3 chars, matching the length gate search.js's
 * maxJustifiedTolerance/snippetFor already use) content word from the raw
 * query, together with everything that should count as satisfying it
 * (itself, its curated/thesaurus synonyms, its decompound parts, and any
 * synthesized separable-verb/joined-compound candidate that was built FROM
 * it) — e.g. for "benzin einbauen" this produces two concepts: {benzin,
 * sprit, treibstoff, kraftstoff, gasoline, fuel} and {einbauen}.
 *
 * Why this exists (see search.js's runSearch doc-comment for the full
 * story): Orama's BM25 scores a flattened multi-term query by summing
 * per-term contributions weighted by each term's corpus-wide IDF. In this
 * vault, a generic repair-manual verb like "einbauen" appears in roughly a
 * third of ALL page titles (nearly every procedure is titled "X aus- und
 * einbauen") so its IDF is tiny — matching it barely moves a document's
 * score. A rarer word like "kraftstoff" has a much higher IDF, so a
 * document that merely repeats "kraftstoff" twice in its title can
 * outscore a document that matches "kraftstoff" once AND "einbauen" once,
 * even though the second document is the more relevant match from a human
 * reader's point of view. This function's grouped output lets the caller
 * apply a coverage bonus (matched DISTINCT concepts, not raw matched terms)
 * on top of Orama's score to correct for that — see search.js's
 * conceptCoverage()/COVERAGE_BOOST_PER_EXTRA_CONCEPT.
 *
 * Deliberately independent from expandQuery() above (some duplicated
 * expansion logic) rather than deriving one from the other, so this
 * additive ranking signal can never change expandQuery()'s existing flat
 * term list (which feeds Orama's actual search term / tolerance escalation
 * and must stay exactly as it already was benchmarked).
 */
export function expandQueryConcepts(rawQuery, synonymMap, dict, vocabulary, compoundParts) {
  const allTokens = tokenize(rawQuery);
  const content = allTokens.filter((t) => !STOPWORDS.has(t));
  const vocab = vocabulary || new Set();
  const precomputed = compoundParts || {};

  const concepts = [];
  const conceptByRaw = new Map();
  for (const tok of content) {
    if (tok.length < 3 || conceptByRaw.has(tok)) continue;
    const terms = new Set([tok]);
    const synonyms = expandSynonyms(synonymMap, tok);
    for (const syn of synonyms) terms.add(syn);
    if (synonyms.length === 0) {
      const parts = precomputed[tok] || decompound(tok, dict);
      if (parts) for (const p of parts) terms.add(p);
    }
    const concept = { raw: tok, terms };
    conceptByRaw.set(tok, concept);
    concepts.push(concept);
  }

  // Separable-verb synthesis: credit the candidate to whichever concept's
  // raw word it was built from (mirrors synthesizeSeparableVerbs' own
  // prefix x verbish loop, but keeps the attribution this function needs).
  const prefixes = allTokens.filter((t) => SPLIT_PREFIX_DENY.has(t));
  for (const prefix of prefixes) {
    for (const concept of concepts) {
      for (const stem of verbStemCandidates(concept.raw)) {
        const candidate = prefix + stem + "en";
        if (vocab.has(candidate)) concept.terms.add(candidate);
      }
    }
  }

  // Joined-compound synthesis: a joined form built from two ADJACENT
  // content words genuinely satisfies both of their concepts at once, so
  // credit it to both (mirrors synthesizeJoinedCompounds' own loop).
  for (let i = 0; i < content.length - 1; i++) {
    const a = content[i];
    const b = content[i + 1];
    if (a.length < MIN_PART_LEN || b.length < MIN_PART_LEN) continue;
    const conceptA = conceptByRaw.get(a);
    const conceptB = conceptByRaw.get(b);
    if (!conceptA && !conceptB) continue;
    for (const fug of FUGEN) {
      const candidate = a + fug + b;
      if (!vocab.has(candidate)) continue;
      if (conceptA) conceptA.terms.add(candidate);
      if (conceptB) conceptB.terms.add(candidate);
    }
  }

  return concepts.map((c) => ({ raw: c.raw, terms: [...c.terms] }));
}
