#!/usr/bin/env node
/**
 * build-data.mjs — one-time (rerun-on-demand) data generation for
 * vault-search v2 (see .pipeline/rag/PLAN.md's Stage 2 notes).
 *
 * Rather than shipping two huge generic datasets inside the plugin bundle
 * (OpenThesaurus's full ~48k-line/4MB synonym dump, and
 * all-the-german-words' ~1.6M-word/28MB dictionary — wildly disproportionate
 * for a plugin meant to stay lightweight and mobile-safe), this script does
 * the expensive filtering/validation ONCE, offline, against this specific
 * vault's actual vocabulary, and writes two SMALL derived JSON files that
 * get bundled instead:
 *
 *   - data/synonyms.json      — OpenThesaurus synsets filtered down to only
 *                               those sharing at least one word with this
 *                               vault's vocabulary (title/tag/content across
 *                               all notes). General-language synonym
 *                               coverage (Sprit<->Kraftstoff, etc.) at a
 *                               tiny fraction of the raw dump's size.
 *   - data/compound-parts.json — for every vault vocabulary word long enough
 *                               to be a compound, the validated split (if
 *                               any) found using the FULL 1.6M-word
 *                               all-the-german-words dictionary as the
 *                               trusted word list (far more accurate than
 *                               the runtime dict, which is built only from
 *                               this vault's own title/tag words — narrow
 *                               enough to have caused a real bug during
 *                               benchmarking, see german.js's decompound()
 *                               docs). A vocabulary-word -> parts[] map, a
 *                               few thousand entries at most.
 *
 * Neither `all-the-german-words` nor the raw OpenThesaurus dump are
 * imported by the plugin bundle (src/*.js) — only by this script. Rerun
 * with `npm run build-data` after adding new notes or updating the
 * OpenThesaurus dump (scripts/openthesaurus-raw.txt, gitignored — refetch
 * from https://www.openthesaurus.de/about/download, "Thesaurus im
 * Text-Format").
 *
 * OpenThesaurus data: Copyright (C) Daniel Naber and contributors, licensed
 * CC-BY-SA 4.0 / LGPL 2.1 (see scripts/openthesaurus-LICENSE.txt) — used
 * here as a filtered derivative, attribution retained in this file and in
 * LIESMICH.md per the license's terms.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = Module.createRequire(import.meta.url);
const allTheGermanWords = require("all-the-german-words");
const PLUGIN_DIR = path.resolve(__dirname, "..");
const VAULT_ROOT = path.resolve(PLUGIN_DIR, "..", "..", "..");
const EXCLUDED_DIRS = new Set([".git", ".obsidian", ".pipeline", ".trash"]);

const MIN_PART_LEN = 4;
const MIN_TOKEN_TO_SPLIT = 8;
const MAX_PARTS = 3;
const FUGEN = ["ens", "ns", "es", "en", "s", "n", ""];
const SPLIT_PREFIX_DENY = new Set([
  "aus", "ein", "um", "an", "ab", "auf", "vor", "nach", "zu", "bei", "mit",
  "durch", "ueber", "unter", "be", "ver", "ent", "er", "ge", "zer", "wieder",
]);

function fold(s) {
  return (s || "")
    .toLowerCase()
    .replace(/ü/g, "ue")
    .replace(/ö/g, "oe")
    .replace(/ä/g, "ae")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(text) {
  if (!text) return [];
  const folded = fold(text);
  const out = [];
  const re = /[a-z0-9]+(?:-[a-z0-9]+)*/g;
  let m;
  while ((m = re.exec(folded)) !== null) out.push(m[0]);
  return out;
}

function stripForContent(raw) {
  let text = raw;
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const after = text.indexOf("\n", end + 1);
      text = after !== -1 ? text.slice(after + 1) : "";
    }
  }
  return text
    .replace(/!\[\[[^\]]*\]\]/g, " ")
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
    .replace(/[#>*_`|]/g, " ");
}

function walkMarkdownFiles(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walkMarkdownFiles(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(path.join(dir, entry.name));
    }
  }
}

// ---------------------------------------------------------- 1. vault vocabulary

console.log("=== Step 1: collecting vault vocabulary ===");
const files = [];
walkMarkdownFiles(VAULT_ROOT, files);
const vocabulary = new Set();
for (const full of files) {
  const raw = fs.readFileSync(full, "utf-8");
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    for (const tok of tokenize(fmMatch[1])) vocabulary.add(tok);
  }
  const content = stripForContent(raw);
  for (const tok of tokenize(content)) vocabulary.add(tok);
}
console.log(`Vault vocabulary: ${vocabulary.size} unique folded tokens from ${files.length} notes.`);

// ---------------------------------------------------------- 2. synonyms.json

console.log("\n=== Step 2: filtering OpenThesaurus to vault-relevant synsets ===");
const OT_PATH = path.join(__dirname, "openthesaurus-raw.txt");
if (!fs.existsSync(OT_PATH)) {
  console.error(
    `ERROR: ${OT_PATH} not found. Download "Thesaurus im Text-Format" from ` +
      `https://www.openthesaurus.de/about/download, unzip, and place openthesaurus.txt here ` +
      `(gitignored - not committed raw, only the filtered output is).`
  );
  process.exit(1);
}
const otLines = fs.readFileSync(OT_PATH, "utf-8").split("\n");

// Strip parenthetical usage annotations, e.g. "Sprit (ugs.)" -> "Sprit".
function stripAnnotation(term) {
  return term.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

const synonymPairs = new Set(); // "a|b" folded, a<b lexicographically, deduped
let synsetsKept = 0;
let synsetsTotal = 0;
for (const line of otLines) {
  if (!line || line.startsWith("#")) continue;
  synsetsTotal++;
  const terms = line
    .split(";")
    .map(stripAnnotation)
    .filter(Boolean);
  // Only single-word terms are linked (see german.js's buildSynonymMap doc -
  // cross-linking individual tokens of multi-word phrases produced noise in
  // the original hand-curated groups too).
  const singleWordTerms = terms
    .map((t) => tokenize(t))
    .filter((toks) => toks.length === 1)
    .map((toks) => toks[0])
    .filter((t) => t.length >= 3);
  const uniqueTerms = [...new Set(singleWordTerms)];
  if (uniqueTerms.length < 2) continue;

  // Cap synset size. Confirmed empirically (see PLAN.md's Stage 2 notes):
  // precise technical/colloquial-term synonym pairs are small clusters (2-4
  // members, e.g. "Sprit;Kraftstoff;Treibstoff" or "spannen;zurren;straffen;
  // (stramm)ziehen"). Large clusters (10+) are almost always a broad
  // "colloquial expression" grouping for an AMBIGUOUS/polysemous word - e.g.
  // "spannen (ugs.)" also means "to catch on / understand" in slang, giving
  // a 24-member cluster (verstehen, kapieren, schnallen, durchblicken, ...)
  // that has NOTHING to do with tensioning a belt, but still passed the
  // match-count filter below because words like "ziehen"/"aufziehen" are
  // common enough to independently appear elsewhere in a 1300-page manual.
  // Capping cluster size is a cheap, effective proxy for avoiding this
  // class of word-sense collision without real disambiguation.
  const MAX_SYNSET_SIZE = 8;
  if (uniqueTerms.length > MAX_SYNSET_SIZE) continue;

  // Require AT LEAST TWO vault-vocabulary matches, not just one. A single
  // match isn't enough evidence: general-purpose synsets are per WORD-SENSE,
  // and OpenThesaurus has no sense disambiguation - "Tank" alone pulled in
  // both "Panzerwagen/Panzer" (armored vehicle sense) and "Kübel/Wanne/
  // Zuber/Trog/Bottich" (basin/tub sense), neither relevant to a fuel tank,
  // purely because the bare word "tank" also happens to appear in the
  // vault. Requiring 2+ matches (confirmed empirically during Stage 2
  // benchmarking) reliably keeps genuinely relevant synsets (e.g.
  // "Sprit;Kraftstoff;Treibstoff" - "sprit" AND "kraftstoff" both appear in
  // the vault) while dropping cross-sense noise (single stray overlaps).
  const matchCount = uniqueTerms.filter((t) => vocabulary.has(t)).length;
  if (matchCount < 2) continue;
  synsetsKept++;

  for (let i = 0; i < uniqueTerms.length; i++) {
    for (let j = i + 1; j < uniqueTerms.length; j++) {
      const [a, b] = [uniqueTerms[i], uniqueTerms[j]].sort();
      synonymPairs.add(`${a}|${b}`);
    }
  }
}
console.log(`Synsets: ${synsetsTotal} total, ${synsetsKept} kept (share a word with the vault vocabulary).`);
console.log(`Synonym pairs emitted: ${synonymPairs.size}.`);

const synonymsOut = [...synonymPairs].map((p) => p.split("|"));
fs.writeFileSync(path.join(PLUGIN_DIR, "data", "synonyms.json"), JSON.stringify(synonymsOut));

// ------------------------------------------------------- 3. compound-parts.json

console.log("\n=== Step 3: validating compound splits against all-the-german-words ===");
console.log(`all-the-german-words: ${allTheGermanWords.length} words.`);
const bigDict = new Set();
for (const w of allTheGermanWords) {
  if (!/^[A-Za-zÄÖÜäöüß]+$/.test(w)) continue; // single alphabetic token only
  bigDict.add(fold(w));
}
console.log(`Filtered to ${bigDict.size} single-token folded words for split validation.`);

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

function decompound(token, dict, depth) {
  if (token.length < MIN_TOKEN_TO_SPLIT) return null;
  if (depth <= 0) return null;
  let best = null;
  for (let i = MIN_PART_LEN; i <= token.length - MIN_PART_LEN; i++) {
    const left = token.slice(0, i);
    if (left.length < MIN_PART_LEN) continue;
    if (!dict.has(left)) continue;
    if (SPLIT_PREFIX_DENY.has(left)) continue;
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

const compoundParts = {};
let attempted = 0;
let found = 0;
for (const tok of vocabulary) {
  if (tok.length < MIN_TOKEN_TO_SPLIT) continue;
  attempted++;
  const parts = decompound(tok, bigDict, MAX_PARTS - 1);
  if (parts) {
    compoundParts[tok] = parts;
    found++;
  }
}
console.log(`Compound candidates attempted: ${attempted}, validated splits found: ${found}.`);
fs.writeFileSync(path.join(PLUGIN_DIR, "data", "compound-parts.json"), JSON.stringify(compoundParts));

console.log("\nWrote data/synonyms.json and data/compound-parts.json.");
