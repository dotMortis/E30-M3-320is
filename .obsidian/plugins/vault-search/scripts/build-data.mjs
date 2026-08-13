#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";
import { fold, tokenize } from "../src/german/fold.js";
import { stripForContent } from "../src/german/strip-content.js";
import { decompound, MIN_TOKEN_TO_SPLIT, MAX_PARTS } from "../src/german/decompound.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = Module.createRequire(import.meta.url);
const allTheGermanWords = require("all-the-german-words");

const PLUGIN_DIR = path.resolve(__dirname, "..");
const VAULT_ROOT = path.resolve(PLUGIN_DIR, "..", "..", "..");
const EXCLUDED_DIRS = new Set([".git", ".obsidian", ".pipeline", ".trash"]);
const OPENTHESAURUS_RAW_PATH = path.join(__dirname, "openthesaurus-raw.txt");
const MIN_SYNONYM_TERM_LENGTH = 3;
const MAX_SYNSET_SIZE = 8;
const MIN_VAULT_MATCHES_TO_KEEP_SYNSET = 2;

/**
 * @param {string} dir
 * @param {string[]} out
 */
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

/**
 * @returns {Set<string>}
 */
function collectVaultVocabulary() {
  const files = [];
  walkMarkdownFiles(VAULT_ROOT, files);

  const vocabulary = new Set();
  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      for (const token of tokenize(frontmatterMatch[1])) vocabulary.add(token);
    }
    for (const token of tokenize(stripForContent(raw))) vocabulary.add(token);
  }

  console.log(`Vault vocabulary: ${vocabulary.size} unique folded tokens from ${files.length} notes.`);
  return vocabulary;
}

/**
 * @param {string} term
 * @returns {string}
 */
function stripAnnotation(term) {
  return term.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

/**
 * @param {string} line
 * @returns {string[]}
 */
function singleWordTermsInSynset(line) {
  const terms = line.split(";").map(stripAnnotation).filter(Boolean);
  const singleWordTerms = terms
    .map((term) => tokenize(term))
    .filter((tokens) => tokens.length === 1)
    .map((tokens) => tokens[0])
    .filter((term) => term.length >= MIN_SYNONYM_TERM_LENGTH);
  return [...new Set(singleWordTerms)];
}

/**
 * @param {string[]} lines
 * @param {Set<string>} vaultVocabulary
 * @returns {{pairs: Set<string>, synsetsTotal: number, synsetsKept: number}}
 */
function buildSynonymPairs(lines, vaultVocabulary) {
  const pairs = new Set();
  let synsetsTotal = 0;
  let synsetsKept = 0;

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    synsetsTotal++;

    const uniqueTerms = singleWordTermsInSynset(line);
    if (uniqueTerms.length < 2 || uniqueTerms.length > MAX_SYNSET_SIZE) continue;

    const matchCount = uniqueTerms.filter((term) => vaultVocabulary.has(term)).length;
    if (matchCount < MIN_VAULT_MATCHES_TO_KEEP_SYNSET) continue;
    synsetsKept++;

    for (let i = 0; i < uniqueTerms.length; i++) {
      for (let j = i + 1; j < uniqueTerms.length; j++) {
        const [a, b] = [uniqueTerms[i], uniqueTerms[j]].sort();
        pairs.add(`${a}|${b}`);
      }
    }
  }

  return { pairs, synsetsTotal, synsetsKept };
}

/**
 * @param {Set<string>} vaultVocabulary
 * @returns {Array<[string, string]>}
 */
function buildFilteredSynonyms(vaultVocabulary) {
  console.log("\n=== Step 2: filtering OpenThesaurus to vault-relevant synsets ===");

  if (!fs.existsSync(OPENTHESAURUS_RAW_PATH)) {
    console.error(
      `ERROR: ${OPENTHESAURUS_RAW_PATH} not found. Download "Thesaurus im Text-Format" from ` +
        `https://www.openthesaurus.de/about/download, unzip, and place openthesaurus.txt here.`
    );
    process.exit(1);
  }

  const lines = fs.readFileSync(OPENTHESAURUS_RAW_PATH, "utf-8").split("\n");
  const { pairs, synsetsTotal, synsetsKept } = buildSynonymPairs(lines, vaultVocabulary);

  console.log(`Synsets: ${synsetsTotal} total, ${synsetsKept} kept (share a word with the vault vocabulary).`);
  console.log(`Synonym pairs emitted: ${pairs.size}.`);

  return [...pairs].map((pair) => pair.split("|"));
}

/**
 * @returns {Set<string>}
 */
function buildBigDictionary() {
  console.log("\n=== Step 3: validating compound splits against all-the-german-words ===");
  console.log(`all-the-german-words: ${allTheGermanWords.length} words.`);

  const bigDict = new Set();
  for (const word of allTheGermanWords) {
    if (!/^[A-Za-zÄÖÜäöüß]+$/.test(word)) continue;
    bigDict.add(fold(word));
  }

  console.log(`Filtered to ${bigDict.size} single-token folded words for split validation.`);
  return bigDict;
}

/**
 * @param {Set<string>} vaultVocabulary
 * @param {Set<string>} bigDict
 * @returns {Record<string, string[]>}
 */
function buildValidatedCompoundParts(vaultVocabulary, bigDict) {
  const compoundParts = {};
  let attempted = 0;
  let found = 0;

  for (const token of vaultVocabulary) {
    if (token.length < MIN_TOKEN_TO_SPLIT) continue;
    attempted++;
    const parts = decompound(token, bigDict, MAX_PARTS - 1);
    if (parts) {
      compoundParts[token] = parts;
      found++;
    }
  }

  console.log(`Compound candidates attempted: ${attempted}, validated splits found: ${found}.`);
  return compoundParts;
}

function main() {
  console.log("=== Step 1: collecting vault vocabulary ===");
  const vaultVocabulary = collectVaultVocabulary();

  const synonyms = buildFilteredSynonyms(vaultVocabulary);
  fs.writeFileSync(path.join(PLUGIN_DIR, "data", "synonyms.json"), JSON.stringify(synonyms));

  const bigDict = buildBigDictionary();
  const compoundParts = buildValidatedCompoundParts(vaultVocabulary, bigDict);
  fs.writeFileSync(path.join(PLUGIN_DIR, "data", "compound-parts.json"), JSON.stringify(compoundParts));

  console.log("\nWrote data/synonyms.json and data/compound-parts.json.");
}

main();
