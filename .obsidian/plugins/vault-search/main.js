"use strict";

const { Plugin, Modal, Component, MarkdownRenderer, Notice, renderMatches } = require("obsidian");

// ---------------------------------------------------------------------------
// Vault Search
//
// A weighted, typo-tolerant search tuned for this static BMW manual vault.
//
// Ranking tiers (high -> low): title > tags > glossary/synonym > content.
// The index is built once, lazily, from Obsidian's metadataCache (frontmatter
// title + tags) plus each note's body text. It never modifies any file.
//
// Because the vault is small (~1300 notes, ~4 MB of text) and static, a full
// in-memory index is cheap and gives us complete control over scoring, typo
// tolerance and synonym expansion -- things the core search cannot do.
// ---------------------------------------------------------------------------

// Score weights per field. Title dominates, then tags, then synonym-expanded
// hits, then plain content. Tuned so a title hit always outranks a pure
// content hit for the same query.
const W_TITLE = 100;
const W_TAG = 40;
const W_CONTENT = 4;

// Synonym-expanded matches are worth this fraction of a literal match. Applied
// as a factor (not a flat cap) so field tiers survive: a synonym title match
// still outranks a synonym content match, but a literal match always wins.
const SYNONYM_FACTOR = 0.5;

// Upper bound on a single term's content contribution. Kept below W_TAG so a
// very frequent content word can never outrank a tag- or title-level match.
const W_CONTENT_CAP = 20;

// Small bonus when a note code (e.g. "16-02") is typed verbatim.
const W_CODE = 60;

// Fuzzy (typo) matches are worth less than exact/substring matches.
const FUZZY_PENALTY = 0.45;

// Max Levenshtein distance allowed for a typo-corrected token, scaled by word
// length below. We only fall back to fuzzy when a token matches nothing.
function maxEditDistance(len) {
  if (len <= 3) return 0; // too short to correct safely
  if (len <= 6) return 1;
  return 2;
}

// Hand-curated colloquial <-> manual-term bridges. The auto-extracted glossary
// does not contain these everyday synonyms, but users type them all the time.
// Keys and values are lowercased German. Expansion is bidirectional.
const COLLOQUIAL_GROUPS = [
  ["benzin", "sprit", "treibstoff", "kraftstoff", "gasoline", "fuel"],
  ["auspuff", "abgasanlage", "schalldämpfer", "exhaust"],
  ["blinker", "fahrtrichtungsanzeiger", "richtungsanzeiger"],
  ["scheibenwischer", "wischer", "scheibenwischanlage"],
  ["kupplung", "clutch"],
  ["getriebe", "schaltgetriebe", "gearbox", "transmission"],
  ["stoßdämpfer", "dämpfer", "federbein", "shock"],
  ["zündkerze", "kerze", "spark plug"],
  ["batterie", "akku", "battery"],
  ["kühler", "kühlung", "radiator", "cooling"],
  ["lichtmaschine", "generator", "alternator"],
  ["anlasser", "starter"],
  ["reifen", "räder", "rad", "tire", "wheel"],
  ["bremse", "bremsen", "brake"],
  ["scheinwerfer", "licht", "beleuchtung", "lampe", "headlight", "light"],
  ["türe", "tür", "türen", "door"],
  ["sitz", "sitze", "seat"],
  ["tank", "kraftstofftank", "kraftstoffbehälter", "fuel tank"],
];

// German + English function words that must never become synonym links or
// carry meaningful weight on their own.
const STOPWORDS = new Set([
  "und", "oder", "der", "die", "das", "den", "dem", "des", "ein", "eine",
  "einer", "eines", "einem", "einen", "im", "in", "am", "an", "auf", "aus",
  "bei", "mit", "von", "vor", "zur", "zum", "fuer", "für", "und", "bzw",
  "beziehungsweise", "the", "and", "for", "to", "of", "on", "in", "at",
  "with", "or", "a", "an",
]);

// Separable-verb / generic prefixes that must never be accepted as the
// left-most part of a compound split. This is what stops "Ausbau" from ever
// being proposed as "aus" + "bau" (and similar), independent of IDF. Folded.
const SPLIT_PREFIX_DENY = new Set([
  "aus", "ein", "um", "an", "ab", "auf", "vor", "nach", "zu", "bei", "mit",
  "durch", "ueber", "unter", "be", "ver", "ent", "er", "ge", "zer", "wieder",
]);

// German linking elements (Fugenelemente) that may sit between two compound
// parts, e.g. Anzug + s + Drehmoment. Tried longest-first. Folded (no umlauts).
const FUGEN = ["ens", "ns", "es", "en", "s", "n", ""];

// Compound decompounding tunables.
const MIN_PART_LEN = 4; // a split part must be at least this long
const MIN_TOKEN_TO_SPLIT = 8; // only attempt to split tokens this long or longer
const MAX_PARTS = 3; // recursion cap: at most this many parts

// A compound-derived sub-token match is worth this fraction of a literal match
// (more trustworthy than a raw substring scan, since it's a validated boundary).
const SPLIT_QUALITY = 0.9;

// IDF rarity multiplier clamp. A term in almost every note approaches IDF_MIN;
// a term in very few notes approaches IDF_MAX. Keeps a generic word like "bau"
// from ever contributing much, without zeroing anything entirely.
const IDF_MIN = 0.15;
const IDF_MAX = 1.6;

// -------------------------------------------------------------------- helpers

// Normalise for matching. German umlauts/ß are expanded to their standard
// ASCII digraphs (ü->ue, ö->oe, ä->ae, ß->ss) BEFORE stripping any remaining
// diacritics. This means a title "Türverkleidung" and a typed "tuerverkleidung"
// both fold to "tuerverkleidung", while a genuine "ue" (e.g. "Steuer") is left
// intact. Consistent on both index and query side.
function fold(s) {
  return (s || "")
    .toLowerCase()
    .replace(/ü/g, "ue")
    .replace(/ö/g, "oe")
    .replace(/ä/g, "ae")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // strip any other diacritics (é, etc.)
}

// Character-by-character variant of fold() that also records provenance: for
// each character in the folded output, map[j] is the index in the ORIGINAL
// string that produced it. Umlauts/ß expand to two ASCII chars, so both folded
// chars map back to the single original char (e.g. "ü" -> "ue", both -> same
// index). Diacritic-only combining marks fold to nothing and contribute no
// output chars. Kept behaviourally identical to fold() so index/query matching
// and highlight offsets stay consistent.
const FOLD_EXPAND = { "ü": "ue", "ö": "oe", "ä": "ae", "ß": "ss" };
function foldWithMap(s) {
  s = s || "";
  let folded = "";
  const map = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const lower = ch.toLowerCase();
    // multi-char lowercase (rare) still handled: each output char maps to i
    const expanded = FOLD_EXPAND[lower] !== undefined ? FOLD_EXPAND[lower] : lower;
    // strip diacritics from the expansion the same way fold() does
    const norm = expanded.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (let k = 0; k < norm.length; k++) {
      folded += norm[k];
      map.push(i);
    }
  }
  return { folded, map };
}

// Find highlight ranges in `text` for a set of already-resolved (folded) match
// terms. Folds `text` via foldWithMap, scans for each term as a substring, maps
// folded hit offsets back to original-text [start, end] character ranges, then
// sorts and merges overlaps. Returns a SearchMatches-compatible array suitable
// for renderMatches(). Only terms of length >= 2 are considered (single chars
// would bold almost everything).
function findTermRanges(text, terms) {
  if (!text || !terms || terms.size === 0) return [];
  const { folded, map } = foldWithMap(text);
  if (!folded) return [];
  const ranges = [];
  for (const term of terms) {
    if (!term || term.length < 2) continue;
    let from = 0;
    let pos;
    while ((pos = folded.indexOf(term, from)) !== -1) {
      const startOrig = map[pos];
      // end maps to the original index just past the last folded char
      const lastFolded = pos + term.length - 1;
      const endOrig = map[lastFolded] + 1;
      ranges.push([startOrig, endOrig]);
      from = pos + term.length;
    }
  }
  if (ranges.length === 0) return [];
  // sort by start, then merge overlapping/adjacent ranges (renderMatches
  // expects ascending, non-overlapping ranges).
  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const prev = merged[merged.length - 1];
    const cur = ranges[i];
    if (cur[0] <= prev[1]) {
      if (cur[1] > prev[1]) prev[1] = cur[1];
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

// Split arbitrary text into searchable tokens. Keeps note codes like 16-02
// together, otherwise splits on non-alphanumeric.
function tokenize(text) {
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

// Classic Levenshtein with an early-out ceiling for performance.
function editDistanceWithin(a, b, ceiling) {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > ceiling) return ceiling + 1;
  let prev = new Array(lb + 1);
  let cur = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;
  for (let i = 1; i <= la; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= lb; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > ceiling) return ceiling + 1;
    const tmp = prev;
    prev = cur;
    cur = tmp;
  }
  return prev[lb];
}

// Strip frontmatter and light markdown so the content field is plain-ish text.
function stripForContent(raw) {
  let text = raw;
  // remove YAML frontmatter block
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const after = text.indexOf("\n", end + 1);
      text = after !== -1 ? text.slice(after + 1) : "";
    }
  }
  // drop image/embed targets and link brackets, callout markers, table pipes
  text = text
    .replace(/!\[\[[^\]]*\]\]/g, " ")
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
    .replace(/[#>*_`|]/g, " ");
  return text;
}

// Return the dictionary base form of `w`: `w` itself if known, otherwise a
// lightly de-inflected form (stripping a trailing plural/case ending) if THAT
// is known, e.g. "scheiben" -> "scheibe", "ventile" -> "ventil". Returns null
// if neither is in the dictionary.
function dictBase(w, dict) {
  if (dict.has(w)) return w;
  // Try stripping a trailing plural/case ending; "scheiben"->"scheibe" is
  // covered by the "n" case (base ends in -e), "ventile"->"ventil" by "e".
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
// (each mapped to its dictionary base form) of length >= 2, or null if no clean
// split is found.
//
// `dict` is a Set of folded known words. `depth` bounds recursion. The result
// prefers fewer parts and then splits whose smallest part is largest (avoids
// leaving tiny scraps). This is a bounded search: token length is small and
// results are memoized by the caller, so cost is negligible for this vault.
function decompound(token, dict, depth) {
  if (token.length < MIN_TOKEN_TO_SPLIT) return null;
  if (depth <= 0) return null;

  let best = null;
  // try a first part of increasing length, leaving room for a valid remainder
  for (let i = MIN_PART_LEN; i <= token.length - MIN_PART_LEN; i++) {
    const left = token.slice(0, i); // token[0..i)
    if (left.length < MIN_PART_LEN) continue;
    if (!dict.has(left)) continue;
    if (SPLIT_PREFIX_DENY.has(left)) continue; // never split off a verb prefix

    // consume an optional linking element after `left`
    for (const fug of FUGEN) {
      const rest = token.slice(i + fug.length);
      if (rest.length < MIN_PART_LEN) continue;
      if (token.slice(i, i + fug.length) !== fug) continue;

      let parts = null;
      const restBase = dictBase(rest, dict);
      if (restBase) {
        parts = [left, restBase]; // 2-part split (remainder de-inflected)
      } else if (depth > 1) {
        const sub = decompound(rest, dict, depth - 1); // deeper split
        if (sub) parts = [left, ...sub];
      }
      if (!parts) continue;
      if (parts.length > MAX_PARTS) continue;

      // rank candidates: fewer parts first, then larger minimum part length
      const minLen = Math.min(...parts.map((p) => p.length));
      if (
        !best ||
        parts.length < best.parts.length ||
        (parts.length === best.parts.length && minLen > best.minLen)
      ) {
        best = { parts, minLen };
      }
    }
  }
  return best ? best.parts : null;
}

// ---------------------------------------------------------------- the index

class VaultIndex {
  constructor(plugin) {
    this.plugin = plugin;
    this.app = plugin.app;
    this.docs = []; // { file, title, tags[], code, section, contentTokenSet, tokenCounts, snippetSource }
    this.vocabulary = new Map(); // token -> frequency (for typo correction)
    this.synonyms = new Map(); // token -> Set(expanded tokens)
    this.dict = new Set(); // trusted words used to validate compound splits
    this.docFreq = new Map(); // token -> number of notes containing it
    this.idf = new Map(); // token -> rarity multiplier (computed after indexing)
    this.splitCache = new Map(); // token -> string[] | null (memoized decompound)
    this.numDocs = 0;
    this.ready = false;
    this.building = null;
  }

  async ensureBuilt() {
    if (this.ready) return;
    if (this.building) return this.building;
    this.building = this._build();
    await this.building;
    this.building = null;
  }

  // Clear all indexed state so the next ensureBuilt() rebuilds from scratch.
  // Used by the "Reload index" command (e.g. after notes changed).
  reset() {
    this.docs = [];
    this.vocabulary = new Map();
    this.synonyms = new Map();
    this.dict = new Set();
    this.docFreq = new Map();
    this.idf = new Map();
    this.splitCache = new Map();
    this.numDocs = 0;
    this.ready = false;
    this.building = null;
  }

  // Force a full rebuild now, even if already built.
  async rebuild() {
    this.reset();
    await this.ensureBuilt();
  }

  async _build() {
    const t0 = Date.now();
    await this._buildSynonyms();

    // ---- Pass 1: read every note, collect literal token sets, build the
    // trusted dictionary + vocabulary + document-frequency counts.
    const mdFiles = this.app.vault.getMarkdownFiles();
    this.numDocs = mdFiles.length;
    for (const file of mdFiles) {
      const cache = this.app.metadataCache.getFileCache(file) || {};
      const fm = cache.frontmatter || {};

      const title = (fm.titel || fm.title || file.basename || "").toString();
      const titleEn = (fm.titel_en || "").toString();
      const section = (fm.sektion || "").toString();
      const code = (fm.seitencode || "").toString();

      // Tags: from frontmatter list; also split "a/b/c" into segments so
      // "diagram" matches "typ/diagram" and "16" matches "sektion/16".
      let tags = [];
      if (Array.isArray(fm.tags)) tags = fm.tags.map((x) => x.toString());
      else if (typeof fm.tags === "string") tags = fm.tags.split(/[,\s]+/);
      const tagTokens = new Set();
      for (const tag of tags) {
        for (const tok of tokenize(tag)) tagTokens.add(tok);
      }

      const titleTokens = new Set([
        ...tokenize(title),
        ...tokenize(titleEn),
        ...tokenize(section),
      ]);
      const codeTokens = new Set(tokenize(code));

      let raw = "";
      try {
        raw = await this.app.vault.cachedRead(file);
      } catch (e) {
        raw = "";
      }
      const contentText = stripForContent(raw);
      const contentTokens = tokenize(contentText);
      const contentSet = new Set(contentTokens);

      // count content-token frequencies (used for scoring emphasis)
      const counts = new Map();
      for (const tok of contentTokens) {
        counts.set(tok, (counts.get(tok) || 0) + 1);
      }

      // feed the vocabulary for typo correction (title/tags/content)
      for (const tok of titleTokens) this._addVocab(tok);
      for (const tok of tagTokens) this._addVocab(tok);
      for (const tok of contentSet) this._addVocab(tok);

      // trusted dictionary: high-signal words only (title + tags), used to
      // validate compound splits. NOT raw content, to avoid OCR-garbage splits.
      for (const tok of titleTokens) this._addDict(tok);
      for (const tok of tagTokens) this._addDict(tok);

      // document frequency: count each unique token once per note.
      const seen = new Set();
      for (const s of [titleTokens, tagTokens, contentSet]) {
        for (const tok of s) {
          if (!seen.has(tok)) {
            seen.add(tok);
            this.docFreq.set(tok, (this.docFreq.get(tok) || 0) + 1);
          }
        }
      }

      this.docs.push({
        file,
        title,
        section,
        code,
        titleTokens,
        tagTokens,
        codeTokens,
        contentSet,
        counts,
        snippetSource: contentText,
        // derived split-part sets filled in during pass 2
        titleParts: null,
        tagParts: null,
        contentParts: null,
      });
    }

    // glossary single words are also trusted dictionary entries.
    for (const [w] of this.synonyms) this._addDict(w);

    // ---- Compute IDF-like rarity multipliers from document frequency.
    // Rare tokens -> higher weight; ubiquitous tokens (bau, einbau, teil) ->
    // strongly suppressed. Clamped to keep scores sane.
    this._computeIdf();

    // ---- Pass 2: decompound long tokens per field into derived sub-tokens.
    for (const doc of this.docs) {
      doc.titleParts = this._deriveParts(doc.titleTokens);
      doc.tagParts = this._deriveParts(doc.tagTokens);
      doc.contentParts = this._deriveParts(doc.contentSet);
    }

    this.ready = true;
    const ms = Date.now() - t0;
    console.log(
      `vault-search: indexed ${this.docs.length} notes, ` +
        `${this.vocabulary.size} tokens, ${this.dict.size} dict words, ` +
        `${this.splitCache.size} split attempts in ${ms}ms`
    );
  }

  _addDict(tok) {
    if (tok.length < MIN_PART_LEN) return;
    if (STOPWORDS.has(tok)) return;
    this.dict.add(tok);
  }

  // Compute an IDF multiplier per token: idf = log((N + 1) / (df + 1)) / log(N),
  // clamped to [IDF_MIN, IDF_MAX] so no single term is fully zeroed or blown up.
  _computeIdf() {
    const N = Math.max(this.numDocs, 1);
    const denom = Math.log(N + 1) || 1;
    for (const [tok, df] of this.docFreq) {
      const raw = Math.log((N + 1) / (df + 1)) / denom; // in ~[0, 1]
      const mult = IDF_MIN + (IDF_MAX - IDF_MIN) * Math.max(0, Math.min(1, raw));
      this.idf.set(tok, mult);
    }
  }

  idfOf(tok) {
    const v = this.idf.get(tok);
    return v === undefined ? IDF_MAX : v; // unknown query terms treated as rare
  }

  // Memoized decompound over the trusted dictionary.
  splitToken(tok) {
    if (this.splitCache.has(tok)) return this.splitCache.get(tok);
    const parts = decompound(tok, this.dict, MAX_PARTS - 1);
    this.splitCache.set(tok, parts);
    return parts;
  }

  // Given a field's literal token set, produce the set of derived compound
  // parts NOT already present as literal tokens (so we don't double count).
  _deriveParts(tokenSet) {
    const out = new Set();
    for (const tok of tokenSet) {
      const parts = this.splitToken(tok);
      if (!parts) continue;
      for (const p of parts) {
        if (!tokenSet.has(p)) out.add(p);
      }
    }
    return out;
  }

  _addVocab(tok) {
    if (tok.length < 2) return;
    this.vocabulary.set(tok, (this.vocabulary.get(tok) || 0) + 1);
  }

  // Build synonym map from the committed glossary plus the colloquial groups.
  async _buildSynonyms() {
    const add = (a, b) => {
      const fa = fold(a);
      const fb = fold(b);
      if (!fa || !fb || fa === fb) return;
      if (fa.length < 3 || fb.length < 3) return; // skip trivially short tokens
      if (STOPWORDS.has(fa) || STOPWORDS.has(fb)) return;
      if (!this.synonyms.has(fa)) this.synonyms.set(fa, new Set());
      this.synonyms.get(fa).add(fb);
    };

    // Colloquial groups may contain multi-word phrases ("fuel tank"). For those
    // we link only single-word entries to single-word entries; a multi-word
    // phrase is reduced to its most specific (longest) token so we still bridge
    // e.g. "kraftstofftank" from the "fuel tank" group without importing noise.
    const singleTokenOf = (phrase) => {
      const toks = tokenize(phrase).filter((t) => !STOPWORDS.has(t) && t.length >= 3);
      if (toks.length === 1) return toks[0];
      return null; // multi-word: don't derive a single synonym token
    };
    const linkColloquial = (a, b) => {
      const ta = singleTokenOf(a);
      const tb = singleTokenOf(b);
      if (ta && tb) {
        add(ta, tb);
        add(tb, ta);
      }
    };

    // Glossary terms: ONLY create a synonym link when BOTH sides are single
    // words. Cross-linking individual tokens of multi-word phrases produced
    // noise (e.g. "kraftstofftank" -> "body"/"plug"), so we deliberately skip
    // phrase-level entries. Single-word DE<->EN and DE<->variant pairs are the
    // reliable, high-signal synonyms.
    const linkGlossary = (a, b) => {
      const ta = tokenize(a);
      const tb = tokenize(b);
      if (ta.length === 1 && tb.length === 1) {
        add(ta[0], tb[0]);
        add(tb[0], ta[0]);
      }
    };

    // 1) colloquial groups (bidirectional, all pairs)
    for (const group of COLLOQUIAL_GROUPS) {
      for (let i = 0; i < group.length; i++) {
        for (let j = 0; j < group.length; j++) {
          if (i !== j) linkColloquial(group[i], group[j]);
        }
      }
    }

    // 2) glossary: link EN <-> DE and DE <-> each variant (single words only)
    try {
      const raw = await this.app.vault.adapter.read(".pipeline/glossary.json");
      const gloss = JSON.parse(raw);
      const terms = Array.isArray(gloss.terms) ? gloss.terms : [];
      for (const t of terms) {
        const de = t.de || "";
        const en = t.en || "";
        const variants = Array.isArray(t.variants) ? t.variants : [];
        if (de && en) linkGlossary(de, en);
        for (const v of variants) {
          if (de) linkGlossary(de, v);
          if (en) linkGlossary(en, v);
        }
      }
      console.log(`vault-search: loaded ${terms.length} glossary terms for synonyms`);
    } catch (e) {
      // Glossary is optional; colloquial groups still work without it.
      console.log("vault-search: glossary.json not available, using colloquial synonyms only");
    }
  }

  // Expand a query token to its synonym tokens (one hop).
  expandSynonyms(tok) {
    const set = this.synonyms.get(tok);
    return set ? Array.from(set) : [];
  }

  // Find the closest vocabulary token to a mistyped token, or null.
  correct(tok) {
    const ceiling = maxEditDistance(tok.length);
    if (ceiling === 0) return null;
    let best = null;
    let bestDist = ceiling + 1;
    let bestFreq = -1;
    for (const [cand, freq] of this.vocabulary) {
      if (Math.abs(cand.length - tok.length) > ceiling) continue;
      if (cand[0] !== tok[0] && ceiling < 2) continue; // cheap prefix filter
      const d = editDistanceWithin(tok, cand, ceiling);
      if (d < bestDist || (d === bestDist && freq > bestFreq)) {
        best = cand;
        bestDist = d;
        bestFreq = freq;
      }
    }
    return bestDist <= ceiling ? best : null;
  }
}

// ---------------------------------------------------------------- scoring

// Substring match against a set of tokens: returns true if `term` is a
// substring of a longer token (e.g. "bremsscheibe" in "bremsscheiben", or
// "einbau" in "einbauen"). Bounded scan.
function hasSubstring(tokenSet, term) {
  for (const t of tokenSet) {
    if (t.length > term.length && t.includes(term)) return true;
  }
  return false;
}

// Score a single (already-resolved) term against a document. `fuzzyFactor`
// discounts the score for typo-corrected terms.
//
// Design: each FIELD contributes independently and we take the best evidence
// per field (exact token > substring token). The tiers are separated by a wide
// enough margin that ANY title-level match outranks ANY content-only match for
// the same term. Content is capped so a very frequent content word can never
// climb into the title tier.
function scoreTermAgainstDoc(index, doc, term, fuzzyFactor) {
  let score = 0;
  let matched = false;

  // Per field the best evidence is chosen in this order:
  //   exact literal token  (1.0)
  //   compound-derived part (SPLIT_QUALITY, e.g. "tank" from "kraftstofftank")
  //   substring of a token  (0.85 / 0.6)
  // Exact always wins; a validated split beats a raw substring.

  // --- code tier (verbatim page code like "16-02")
  if (doc.codeTokens.has(term)) {
    score += W_CODE;
    matched = true;
  }

  // --- title tier
  if (doc.titleTokens.has(term)) {
    score += W_TITLE;
    matched = true;
  } else if (doc.titleParts && doc.titleParts.has(term)) {
    score += W_TITLE * SPLIT_QUALITY;
    matched = true;
  } else if (hasSubstring(doc.titleTokens, term)) {
    score += W_TITLE * 0.85; // e.g. query "bremsscheibe" vs title "Bremsscheiben"
    matched = true;
  }

  // --- tag tier
  if (doc.tagTokens.has(term)) {
    score += W_TAG;
    matched = true;
  } else if (doc.tagParts && doc.tagParts.has(term)) {
    score += W_TAG * SPLIT_QUALITY;
    matched = true;
  } else if (hasSubstring(doc.tagTokens, term)) {
    score += W_TAG * 0.85;
    matched = true;
  }

  // --- content tier (capped; frequency gives a small, bounded lift)
  if (doc.contentSet.has(term)) {
    const freq = doc.counts.get(term) || 1;
    score += Math.min(W_CONTENT * (1 + Math.log(freq)), W_CONTENT_CAP);
    matched = true;
  } else if (doc.contentParts && doc.contentParts.has(term)) {
    score += W_CONTENT * SPLIT_QUALITY;
    matched = true;
  } else if (hasSubstring(doc.contentSet, term)) {
    score += W_CONTENT * 0.6;
    matched = true;
  }

  if (!matched) return 0;

  // Rarity weighting: scale the whole contribution by how discriminative this
  // term is across the vault. Generic terms (bau, einbau, teil) approach
  // IDF_MIN and thus contribute little; specific terms keep near-full weight.
  return score * fuzzyFactor * index.idfOf(term);
}

// ------------------------------------------------------------- search driver

// Run the full weighted/typo-tolerant search for `rawQuery` against `index`.
// Pure function: no UI state. Returns the ranked docs (capped at `limit`), the
// typo-correction hint (if any) and the set of resolved highlight terms so the
// renderer can bold matching characters.
function runSearch(index, rawQuery, limit) {
  const query = (rawQuery || "").trim();
  if (!query || !index.ready) {
    return { docs: [], correction: null, highlightTerms: new Set() };
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return { docs: [], correction: null, highlightTerms: new Set() };
  }

  // Resolve each query token into a set of scored "variants". Each variant
  // carries a `factor` in [0,1] that discounts its field-tier score:
  //   - the token itself                     -> factor 1        (best)
  //   - synonym expansions                   -> SYNONYM_FACTOR  (discounted)
  //   - a typo correction (only if unknown)  -> FUZZY_PENALTY
  //   - a synonym of a typo correction       -> FUZZY_PENALTY * SYNONYM_FACTOR
  // Because the discount is a factor (not a flat cap), a synonym that lands in
  // a title still beats a synonym that only lands in content -- the field
  // tiers are preserved, just scaled down relative to a literal match.
  const perToken = [];
  let correctionNote = null;
  for (const tok of queryTokens) {
    // "primary" variants describe the SAME concept as the typed token; the
    // doc's score for them is best-of (they're alternatives, not additive).
    const primary = [];
    const inVocab = index.vocabulary.has(tok);

    // exact token always considered (even if not in vocab, substring may hit)
    primary.push({ term: tok, factor: 1 });

    // synonyms (discounted by a factor, so a literal match always wins)
    for (const syn of index.expandSynonyms(tok)) {
      primary.push({ term: syn, factor: SYNONYM_FACTOR });
    }

    // typo correction only if the raw token isn't known and long enough
    if (!inVocab) {
      const corrected = index.correct(tok);
      if (corrected && corrected !== tok) {
        primary.push({ term: corrected, factor: FUZZY_PENALTY });
        for (const syn of index.expandSynonyms(corrected)) {
          primary.push({ term: syn, factor: FUZZY_PENALTY * SYNONYM_FACTOR });
        }
        if (!correctionNote) correctionNote = { from: tok, to: corrected };
      }
    }

    // query-side decompounding: a typed compound ("bremsscheibe") also
    // searches for its validated parts ("brems", "scheibe"). Unlike primary
    // variants, parts are ADDITIVE (a doc matching BOTH parts should beat a
    // doc matching only one), each with its own best-of synonym alternatives.
    const partGroups = [];
    const qParts = index.splitToken(tok);
    if (qParts) {
      for (const p of qParts) {
        const alts = [{ term: p, factor: SPLIT_QUALITY }];
        for (const syn of index.expandSynonyms(p)) {
          alts.push({ term: syn, factor: SPLIT_QUALITY * SYNONYM_FACTOR });
        }
        partGroups.push(alts);
      }
    }

    perToken.push({ raw: tok, primary, partGroups });
  }

  const bestOf = (doc, variants) => {
    let best = 0;
    for (const v of variants) {
      const s = scoreTermAgainstDoc(index, doc, v.term, v.factor);
      if (s > best) best = s;
    }
    return best;
  };

  // Score one query token against a doc: the better of
  //   (a) a single match on the full token / its synonyms / a typo fix, or
  //   (b) the SUM over the token's compound parts (best-of each part's alts),
  // so matching more parts of a compound scores higher, but a full literal
  // match still wins outright.
  const bestForToken = (doc, t) => {
    let primaryBest = bestOf(doc, t.primary);
    let partsSum = 0;
    for (const alts of t.partGroups) partsSum += bestOf(doc, alts);
    return Math.max(primaryBest, partsSum);
  };

  // Score documents. A doc must match every query token (AND) via at least
  // one of that token's variants.
  const scoreDoc = (doc) => {
    let total = 0;
    for (const t of perToken) {
      const b = bestForToken(doc, t);
      if (b <= 0) return { ok: false, score: 0 };
      total += b;
    }
    return { ok: true, score: total };
  };

  let results = [];
  for (const doc of index.docs) {
    const r = scoreDoc(doc);
    if (r.ok) results.push({ doc, score: r.score });
  }

  // OR fallback: if AND produced nothing, rank by how many tokens matched
  // (primary) then by accumulated score (secondary), so you never get an
  // empty result page while a partial match exists.
  if (results.length === 0) {
    for (const doc of index.docs) {
      let matchedTokens = 0;
      let total = 0;
      for (const t of perToken) {
        const b = bestForToken(doc, t);
        if (b > 0) {
          matchedTokens++;
          total += b;
        }
      }
      if (matchedTokens > 0) {
        results.push({ doc, score: matchedTokens * 1e6 + total });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);

  // Collect every resolved (folded) term that drove scoring so the renderer
  // can bold the matching characters -- including synonyms, typo corrections
  // and decompound parts, not just the literal query text.
  const highlightTerms = new Set();
  for (const t of perToken) {
    for (const v of t.primary) highlightTerms.add(v.term);
    for (const alts of t.partGroups) {
      for (const v of alts) highlightTerms.add(v.term);
    }
  }

  const cap = limit && limit > 0 ? limit : results.length;
  return {
    docs: results.slice(0, cap).map((r) => r.doc),
    correction: correctionNote,
    highlightTerms,
  };
}

// Build a short matched-text snippet from a doc's content around the earliest
// occurrence of any raw query token. Pure function. Returns "" if nothing hits.
function snippetFor(doc, rawQuery) {
  const q = tokenize(rawQuery || "");
  if (q.length === 0) return "";
  const src = doc.snippetSource || "";
  const foldedSrc = fold(src);
  // find the earliest position of any query token (or a substring of it)
  let pos = -1;
  for (const tok of q) {
    const p = foldedSrc.indexOf(tok);
    if (p !== -1 && (pos === -1 || p < pos)) pos = p;
  }
  if (pos === -1) return "";
  const start = Math.max(0, pos - 40);
  const end = Math.min(src.length, pos + 80);
  let snip = src.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snip = "… " + snip;
  if (end < src.length) snip = snip + " …";
  return snip;
}

// ---------------------------------------------------------------- the modal

// Debounce (ms) before rendering a preview, so sweeping the mouse across many
// rows (or holding an arrow key) doesn't trigger a markdown render per row.
const PREVIEW_DEBOUNCE_MS = 80;

// Max results to score/show in the list.
const RESULT_LIMIT = 50;

class VaultSearchModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.index = plugin.index;

    this.results = []; // current ranked docs
    this.correction = null; // typo-correction hint for the current query
    this.highlightTerms = new Set(); // folded terms to bold in rows
    this.activeIndex = -1; // currently highlighted/previewed row
    this.rowEls = []; // per-result row elements (parallel to this.results)
    this._previewTimer = null; // debounce handle
    this._previewToken = 0; // guards against out-of-order async previews
    this._previewComponent = null; // lifecycle owner for rendered markdown
  }

  onOpen() {
    this.modalEl.addClass("vault-search-modal");
    this.contentEl.addClass("vault-search-content");

    // ---- left column: input pinned on top, scrollable result list below.
    const left = this.contentEl.createDiv({ cls: "vault-search-left" });

    this.inputEl = left.createEl("input", {
      cls: "vault-search-input",
      attr: {
        type: "text",
        placeholder: "Suche im Handbuch (Titel > Tags > Inhalt, tippfehlertolerant)…",
        spellcheck: "false",
      },
    });

    this.listEl = left.createDiv({ cls: "vault-search-list" });

    // ---- right column: padded, scrollable markdown preview.
    this.previewEl = this.contentEl.createDiv({
      cls: "vault-search-preview markdown-rendered",
    });
    this._setPreviewPlaceholder("");

    // wire interactions
    this.inputEl.addEventListener("input", () => this._onQueryChanged());
    this.scope.register([], "ArrowDown", (evt) => {
      evt.preventDefault();
      this._moveActive(1);
      return false;
    });
    this.scope.register([], "ArrowUp", (evt) => {
      evt.preventDefault();
      this._moveActive(-1);
      return false;
    });
    this.scope.register([], "Enter", (evt) => {
      evt.preventDefault();
      this._openActive();
      return false;
    });

    // Build the index the first time the modal is opened, then focus + render.
    if (!this.index.ready) {
      this.listEl.setText("Baue Suchindex …");
      this.index
        .ensureBuilt()
        .then(() => this._onQueryChanged())
        .catch((e) => {
          console.error("vault-search: index build failed", e);
          this.listEl.setText("Indexaufbau fehlgeschlagen (siehe Konsole).");
        });
    } else {
      this._onQueryChanged();
    }

    // focus the input so typing starts immediately
    window.setTimeout(() => this.inputEl.focus(), 0);
  }

  onClose() {
    if (this._previewTimer) {
      window.clearTimeout(this._previewTimer);
      this._previewTimer = null;
    }
    if (this._previewComponent) {
      this._previewComponent.unload();
      this._previewComponent = null;
    }
    this.contentEl.empty();
  }

  // Re-run the search for the current input and rebuild the result list.
  _onQueryChanged() {
    if (!this.index.ready) return;
    const raw = this.inputEl.value || "";
    const { docs, correction, highlightTerms } = runSearch(
      this.index,
      raw,
      RESULT_LIMIT
    );
    this.results = docs;
    this.correction = correction;
    this.highlightTerms = highlightTerms;
    this._renderList();

    // auto-select + preview the top result so the pane is never empty.
    if (this.results.length > 0) {
      this._setActive(0, true);
    } else {
      this.activeIndex = -1;
      this._setPreviewPlaceholder(raw.trim() ? "Keine Treffer." : "");
    }
  }

  _renderList() {
    this.listEl.empty();
    this.rowEls = [];

    if (this.results.length === 0) return;

    const raw = this.inputEl.value || "";
    this.results.forEach((doc, i) => {
      const el = this.listEl.createDiv({ cls: "vault-search-suggestion" });
      this.rowEls.push(el);

      const titleEl = el.createDiv({ cls: "vault-search-title" });
      if (doc.code) {
        renderMatches(titleEl, doc.code, findTermRanges(doc.code, this.highlightTerms));
        titleEl.appendText(" · ");
      }
      const titleText = doc.title || doc.file.basename;
      renderMatches(titleEl, titleText, findTermRanges(titleText, this.highlightTerms));

      const meta = [];
      if (doc.section) meta.push(doc.section);
      if (this.correction) meta.push(`(meintest du „${this.correction.to}"?)`);
      if (meta.length) {
        el.createDiv({ cls: "vault-search-meta", text: meta.join(" — ") });
      }

      const snippet = snippetFor(doc, raw);
      if (snippet) {
        const snEl = el.createDiv({ cls: "vault-search-snippet" });
        renderMatches(snEl, snippet, findTermRanges(snippet, this.highlightTerms));
      }

      el.addEventListener("mouseenter", () => this._setActive(i, true));
      el.addEventListener("click", () => {
        this._setActive(i, false);
        this._openActive();
      });
    });
  }

  // Move the active row by `delta`, wrapping, and sync the preview.
  _moveActive(delta) {
    if (this.results.length === 0) return;
    let next = this.activeIndex + delta;
    if (next < 0) next = this.results.length - 1;
    if (next >= this.results.length) next = 0;
    this._setActive(next, true);
  }

  // Mark row `i` active; when `preview` is true also (debounced) render it.
  _setActive(i, preview) {
    if (i < 0 || i >= this.results.length) return;
    if (this.activeIndex >= 0 && this.rowEls[this.activeIndex]) {
      this.rowEls[this.activeIndex].removeClass("is-active");
    }
    this.activeIndex = i;
    const el = this.rowEls[i];
    if (el) {
      el.addClass("is-active");
      el.scrollIntoView({ block: "nearest" });
    }
    if (preview) this._schedulePreview(this.results[i]);
  }

  _schedulePreview(doc) {
    if (this._previewTimer) window.clearTimeout(this._previewTimer);
    this._previewTimer = window.setTimeout(() => {
      this._previewTimer = null;
      this._renderPreview(doc);
    }, PREVIEW_DEBOUNCE_MS);
  }

  async _renderPreview(doc) {
    if (!doc) return;
    const token = ++this._previewToken;

    // tear down the previous render's lifecycle owner
    if (this._previewComponent) {
      this._previewComponent.unload();
      this._previewComponent = null;
    }
    this.previewEl.empty();
    this.previewEl.removeClass("vault-search-preview-empty");

    let raw = "";
    try {
      raw = await this.app.vault.cachedRead(doc.file);
    } catch (e) {
      raw = "";
    }
    // a newer preview was requested while we were reading -> abandon this one
    if (token !== this._previewToken) return;

    const component = new Component();
    component.load();
    this._previewComponent = component;
    try {
      await MarkdownRenderer.render(
        this.app,
        raw,
        this.previewEl,
        doc.file.path,
        component
      );
    } catch (e) {
      console.error("vault-search: preview render failed", e);
      if (token === this._previewToken) {
        this._setPreviewPlaceholder("Vorschau konnte nicht gerendert werden.");
      }
    }
  }

  _setPreviewPlaceholder(text) {
    if (this._previewComponent) {
      this._previewComponent.unload();
      this._previewComponent = null;
    }
    this.previewEl.empty();
    this.previewEl.addClass("vault-search-preview-empty");
    if (text) this.previewEl.setText(text);
  }

  _openActive() {
    if (this.activeIndex < 0 || this.activeIndex >= this.results.length) return;
    const doc = this.results[this.activeIndex];
    this.close();
    this.app.workspace.getLeaf(false).openFile(doc.file);
  }
}

// ---------------------------------------------------------------- plugin

module.exports = class VaultSearchPlugin extends Plugin {
  onload() {
    this.index = new VaultIndex(this);

    // Kick off index building in the background once the layout is ready so
    // the first search is instant. Non-blocking.
    this.app.workspace.onLayoutReady(() => {
      this.index.ensureBuilt().catch((e) =>
        console.error("vault-search: background index build failed", e)
      );
    });

    this.addCommand({
      id: "open-vault-search",
      name: "Handbuch durchsuchen (gewichtet, tippfehlertolerant)",
      // Replace the standard global-search shortcut with this search, and add
      // Ctrl+Space as a quick-open alternative.
      hotkeys: [
        { modifiers: ["Mod", "Shift"], key: "F" },
        { modifiers: ["Ctrl"], key: "Space" },
      ],
      callback: () => {
        new VaultSearchModal(this.app, this).open();
      },
    });

    // Rebuild the in-memory search index on demand (e.g. after editing notes).
    // Note: this reloads the index DATA only; changes to the plugin's own code
    // still require toggling the plugin off/on in Community-Plugins settings.
    this.addCommand({
      id: "reload-vault-search-index",
      name: "Suchindex neu aufbauen",
      callback: async () => {
        const notice = new Notice("Vault Search: Suchindex wird neu aufgebaut …", 0);
        try {
          await this.index.rebuild();
          notice.hide();
          new Notice(
            `Vault Search: Suchindex neu aufgebaut (${this.index.docs.length} Seiten).`,
            4000
          );
        } catch (e) {
          notice.hide();
          console.error("vault-search: reload index failed", e);
          new Notice("Vault Search: Neuaufbau fehlgeschlagen (siehe Konsole).", 6000);
        }
      },
    });
  }
};
