/**
 * main.js — Vault Search v2 (Stage 2 rewrite, see .pipeline/rag/PLAN.md).
 * Same UX/command/hotkeys and the same `api.search()` contract rag-chat's
 * fuzzy leg depends on (see retriever.ts's FuzzySearchApi) — only the
 * underlying matching engine changed: from a ~700-line hand-rolled
 * scorer to Orama (BM25 + native typo tolerance) fed by a German
 * preprocessing layer (german.js) that adds compound/verb-boundary
 * tolerance in BOTH directions and fixes a stopword gap that was
 * confirmed (via live benchmarking) to pollute ranking.
 */

import { Plugin, Modal, Component, MarkdownRenderer, Notice, renderMatches } from "obsidian";
import { createIndex, insertDocs } from "./schema.js";
import { runSearch } from "./search.js";
import { findTermRanges } from "./highlight.js";
import { tokenize, stripForContent, buildSynonymMap, buildDictionary } from "./german.js";
// data/synonyms.json + data/compound-parts.json are small, vault-filtered
// derivatives of OpenThesaurus + all-the-german-words (see
// scripts/build-data.mjs) - deliberately NOT statically imported here.
// esbuild inlines a statically-imported JSON module as a JS array/object
// LITERAL directly in the bundle; for these two files (~419KB + ~344KB)
// that meant ~800KB of executable source V8 had to parse/compile on every
// plugin load, on top of the actual code. Instead they're read as plain
// JSON files at runtime (see SearchEngine._loadJsonDataFile(), mirroring
// the existing _loadGlossaryTerms() pattern below) - same two files, still
// shipped alongside main.js in this plugin's own folder, just loaded as
// data instead of bundled as code.

const RESULT_LIMIT = 50;
const PREVIEW_DEBOUNCE_MS = 80;
// How long to wait after the last keystroke before actually running a
// search. Previously there was NO debounce here (only the preview pane
// was debounced) - every keystroke triggered up to 3 full Orama searches
// (see search.js's escalatingSearch), and fast typing on slower hardware
// queued up multiple overlapping multi-pass searches whose results were
// then immediately discarded by the stale-query guard below. 120ms is
// short enough to feel instant to a typing user, long enough to collapse
// a fast typist's keystrokes into a single search per pause.
const QUERY_DEBOUNCE_MS = 120;
// Index building used to `await this.app.vault.cachedRead(file)` one file
// at a time in a plain `for` loop - every file's read had to finish before
// the next one even started, even though these per-file reads are fully
// independent of each other. Capping concurrency (rather than firing all
// reads at once via a single Promise.all) avoids opening an unbounded
// number of file handles/promises at once on a very large vault.
const INDEX_BUILD_CONCURRENCY = 32;
// Small LRU cache of full search results, keyed by (limit + normalized
// query string) - see SearchEngine.search()/_getCachedSearch()/
// _setCachedSearch() below. Retyping/backspacing to a previously-issued
// query (common while typing, or when a query happens to match a prior
// one after the debounce) re-runs the ENTIRE expansion pipeline (german.js)
// and every Orama search pass from scratch with no cache today; a tiny
// cache turns a repeat into an O(1) lookup instead. 20 entries comfortably
// covers a single search-modal session's worth of back-and-forth without
// holding onto meaningfully more memory.
const SEARCH_CACHE_MAX_ENTRIES = 20;

/** Runs `fn` over `items` with at most `limit` calls in flight at once,
 * returning results in the SAME order as `items` (unlike Promise.all over
 * a manually-chunked array, a fixed pool of workers keeps slower items
 * from blocking faster ones behind them within the same chunk). Generic/
 * dependency-free on purpose - this is the only place in the plugin that
 * needs bounded concurrency. */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    for (;;) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

// -------------------------------------------------------------- index build

// Exported purely for testability (see __tests__/search-engine.build.test.js)
// - harmless in production, same reasoning as VaultSearchModal's export
// above (vite.config.mjs's Rollup output footer only keeps `.default`).
export class SearchEngine {
  constructor(app, pluginDir) {
    this.app = app;
    // Directory of THIS plugin within the vault (e.g.
    // ".obsidian/plugins/vault-search"), used to locate data/*.json
    // relative to the plugin's own folder via vault.adapter.read() - see
    // _loadJsonDataFile(). Passed in from VaultSearchPlugin.onload()'s
    // `this.manifest.dir` (set by Obsidian's plugin loader); falls back to
    // the conventional path if somehow unset (e.g. in a test double).
    this.pluginDir = pluginDir || ".obsidian/plugins/vault-search";
    this.db = null;
    this.vocabulary = new Set();
    this.contentByRowId = new Map();
    this.synonymMap = new Map();
    this.dict = new Set();
    this.compoundParts = {};
    this.ready = false;
    this.building = null;
    // Map's insertion order doubles as LRU recency order (see
    // _getCachedSearch()/_setCachedSearch()) - re-inserting a key on
    // access moves it to the "most recently used" end.
    this._searchCache = new Map();
  }

  async ensureBuilt() {
    if (this.ready) return;
    if (this.building) return this.building;
    this.building = this._build();
    await this.building;
    this.building = null;
  }

  async rebuild() {
    this.ready = false;
    this.db = null;
    this.vocabulary = new Set();
    this.contentByRowId = new Map();
    this._searchCache.clear(); // stale results/expansions must not survive a rebuild
    await this.ensureBuilt();
  }

  _getCachedSearch(key) {
    if (!this._searchCache.has(key)) return undefined;
    const value = this._searchCache.get(key);
    this._searchCache.delete(key);
    this._searchCache.set(key, value); // mark as most-recently-used
    return value;
  }

  _setCachedSearch(key, value) {
    this._searchCache.delete(key);
    this._searchCache.set(key, value);
    if (this._searchCache.size > SEARCH_CACHE_MAX_ENTRIES) {
      const oldestKey = this._searchCache.keys().next().value;
      this._searchCache.delete(oldestKey);
    }
  }

  async _loadGlossaryTerms() {
    try {
      const raw = await this.app.vault.adapter.read(".pipeline/glossary.json");
      const gloss = JSON.parse(raw);
      return Array.isArray(gloss.terms) ? gloss.terms : [];
    } catch (e) {
      console.log("vault-search: glossary.json not available, using colloquial synonyms only");
      return [];
    }
  }

  /** Reads and JSON-parses a data file from this plugin's own folder (see
   * `pluginDir` above) at runtime, instead of it being esbuild-inlined as
   * a JS literal at build time (see the module docstring's note on
   * data/synonyms.json + data/compound-parts.json). Falls back to
   * `fallback` (and logs, doesn't throw) if the file is missing or
   * unparseable, same graceful-degradation shape as _loadGlossaryTerms()
   * above - a missing/corrupt data file should degrade search quality
   * slightly, never crash index building. */
  async _loadJsonDataFile(relPath, fallback) {
    try {
      const raw = await this.app.vault.adapter.read(`${this.pluginDir}/${relPath}`);
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`vault-search: could not load ${relPath}, continuing without it`, e);
      return fallback;
    }
  }

  async _build() {
    const t0 = Date.now();
    // These three are independent reads - fetch them concurrently rather
    // than one after another.
    const [glossaryTerms, openThesaurusPairs, compoundParts] = await Promise.all([
      this._loadGlossaryTerms(),
      this._loadJsonDataFile("data/synonyms.json", []),
      this._loadJsonDataFile("data/compound-parts.json", {}),
    ]);
    this.synonymMap = buildSynonymMap(glossaryTerms, openThesaurusPairs);
    this.compoundParts = compoundParts;

    const mdFiles = this.app.vault.getMarkdownFiles();

    // Pass 1 (concurrent, I/O-bound): extract frontmatter fields (cheap,
    // synchronous - metadataCache is already in-memory) and read each
    // file's content (the actual I/O) with up to INDEX_BUILD_CONCURRENCY
    // reads in flight at once, instead of strictly one-at-a-time.
    const docs = await mapWithConcurrency(mdFiles, INDEX_BUILD_CONCURRENCY, async (file) => {
      const cache = this.app.metadataCache.getFileCache(file) || {};
      const fm = cache.frontmatter || {};
      const titel = (fm.titel || fm.title || file.basename || "").toString();
      const titleEn = (fm.titel_en || "").toString();
      const section = (fm.sektion || "").toString();
      const code = (fm.seitencode || "").toString();

      let tags = [];
      if (Array.isArray(fm.tags)) tags = fm.tags.map((x) => x.toString());
      else if (typeof fm.tags === "string") tags = fm.tags.split(/[,\s]+/);

      let raw = "";
      try {
        raw = await this.app.vault.cachedRead(file);
      } catch (e) {
        raw = "";
      }
      const content = stripForContent(raw);

      return { rowId: file.path, notePath: file.path, code, titel, titleEn, section, tags, content };
    });

    // Pass 2 (sequential, CPU-only, order-independent): tokenize each
    // file's fields into the dictionary/vocabulary inputs. Kept as a
    // separate pass (rather than folded into pass 1's per-file callback)
    // so `docs` stays in the original `mdFiles` order regardless of which
    // read finished first - purely for determinism/debuggability, since
    // neither buildDictionary() nor a Set's insertion order affects search
    // results.
    const titleAndTagTokenLists = [];
    const rawByRowId = new Map();
    for (const doc of docs) {
      rawByRowId.set(doc.rowId, doc.content);

      titleAndTagTokenLists.push(tokenize(doc.titel));
      titleAndTagTokenLists.push(tokenize(doc.titleEn));
      titleAndTagTokenLists.push(tokenize(doc.section));
      for (const tag of doc.tags) titleAndTagTokenLists.push(tokenize(tag));

      for (const tok of tokenize(doc.titel)) this.vocabulary.add(tok);
      for (const tok of tokenize(doc.titleEn)) this.vocabulary.add(tok);
      for (const tag of doc.tags) for (const tok of tokenize(tag)) this.vocabulary.add(tok);
      // Content tokens too (not just title/tags) - this vocabulary set also
      // gates query-side synthesis (synthesizeSeparableVerbs/
      // synthesizeJoinedCompounds in german.js), which needs to validate
      // candidates against real corpus words wherever they appear, not just
      // in titles (many repair-verb infinitives only appear in body text).
      for (const tok of tokenize(doc.content)) this.vocabulary.add(tok);
    }

    this.dict = buildDictionary(titleAndTagTokenLists, this.synonymMap);
    this.contentByRowId = rawByRowId;

    this.db = await createIndex();
    await insertDocs(this.db, docs);

    this.ready = true;
    const ms = Date.now() - t0;
    console.log(`vault-search: indexed ${docs.length} notes, ${this.vocabulary.size} vocab tokens, ${this.dict.size} dict words in ${ms}ms`);
  }

  async search(query, limit, shouldAbort) {
    await this.ensureBuilt();
    const effectiveLimit = limit ?? RESULT_LIMIT;
    const cacheKey = `${effectiveLimit}:${(query || "").trim()}`;
    const cached = this._getCachedSearch(cacheKey);
    if (cached) return cached;

    const result = await runSearch(
      this.db,
      query,
      effectiveLimit,
      this.vocabulary,
      this.contentByRowId,
      this.synonymMap,
      this.dict,
      this.compoundParts,
      shouldAbort
    );
    // Never cache a result a newer query already superseded (see
    // search.js's `shouldAbort`) - it may reflect only a partial
    // escalation pass and would otherwise incorrectly serve as the
    // "final" answer if the exact same query string is retried later.
    if (!shouldAbort || !shouldAbort()) {
      this._setCachedSearch(cacheKey, result);
    }
    return result;
  }
}

// ---------------------------------------------------------------- the modal

// Exported (not just internal to the plugin) purely for testability - lets
// __tests__/modal.smoke.test.js exercise debounce/cancellation behavior
// directly. Harmless in production: vite.config.mjs's Rollup output footer
// takes only `module.exports.default` (see vite.config.mjs's comment), so
// this named export never reaches the bundled main.js Obsidian actually
// loads.
export class VaultSearchModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.engine = plugin.engine;

    this.results = [];
    this.correction = null;
    this.highlightTerms = [];
    this.activeIndex = -1;
    this.rowEls = [];
    this._previewTimer = null;
    this._previewToken = 0;
    this._previewComponent = null;
    this._queryToken = 0;
    this._queryTimer = null;
  }

  onOpen() {
    this.modalEl.addClass("vault-search-modal");
    this.contentEl.addClass("vault-search-content");

    const left = this.contentEl.createDiv({ cls: "vault-search-left" });

    this.inputEl = left.createEl("input", {
      cls: "vault-search-input",
      attr: {
        type: "text",
        placeholder: "Suche im Handbuch (Titel > Tags > Inhalt, tippfehler-/leerzeichentolerant)…",
        spellcheck: "false",
      },
    });

    this.listEl = left.createDiv({ cls: "vault-search-list" });

    this.previewEl = this.contentEl.createDiv({ cls: "vault-search-preview markdown-rendered" });
    this._setPreviewPlaceholder("");

    this.inputEl.addEventListener("input", () => this._scheduleQueryChanged());
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

    if (!this.engine.ready) {
      this.listEl.setText("Baue Suchindex …");
      this.engine
        .ensureBuilt()
        .then(() => this._onQueryChanged())
        .catch((e) => {
          console.error("vault-search: index build failed", e);
          this.listEl.setText("Indexaufbau fehlgeschlagen (siehe Konsole).");
        });
    } else {
      this._onQueryChanged();
    }

    window.setTimeout(() => this.inputEl.focus(), 0);
  }

  onClose() {
    if (this._queryTimer) {
      window.clearTimeout(this._queryTimer);
      this._queryTimer = null;
    }
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

  /** Debounces `_onQueryChanged()` so a burst of fast keystrokes collapses
   * into a single search once typing pauses, instead of one (up to 3-pass)
   * search per keystroke. `_onQueryChanged()` itself still guards against
   * a stale response race via `_queryToken`, independent of this timer. */
  _scheduleQueryChanged() {
    if (this._queryTimer) window.clearTimeout(this._queryTimer);
    this._queryTimer = window.setTimeout(() => {
      this._queryTimer = null;
      this._onQueryChanged();
    }, QUERY_DEBOUNCE_MS);
  }

  async _onQueryChanged() {
    if (!this.engine.ready) return;
    const raw = this.inputEl.value || "";
    const token = ++this._queryToken;
    // Passed down to runSearch (via engine.search) so escalatingSearch can
    // stop issuing further tolerance passes once THIS query is no longer
    // the latest one - see search.js's runSearch doc-comment.
    const shouldAbort = () => token !== this._queryToken;
    const { results, correction, expandedTerms } = await this.engine.search(raw, RESULT_LIMIT, shouldAbort);
    if (shouldAbort()) return; // a newer query superseded this one

    this.results = results;
    this.correction = correction;
    this.highlightTerms = expandedTerms;
    this._renderList();

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

    this.results.forEach((doc, i) => {
      const el = this.listEl.createDiv({ cls: "vault-search-suggestion" });
      this.rowEls.push(el);

      const titleEl = el.createDiv({ cls: "vault-search-title" });
      if (doc.seitencode) {
        renderMatches(titleEl, doc.seitencode, findTermRanges(doc.seitencode, this.highlightTerms));
        titleEl.appendText(" · ");
      }
      const titleText = doc.titel || doc.notePath;
      renderMatches(titleEl, titleText, findTermRanges(titleText, this.highlightTerms));

      const meta = [];
      if (doc.sektion) meta.push(doc.sektion);
      if (this.correction) meta.push(`(meintest du „${this.correction.to}"?)`);
      if (meta.length) el.createDiv({ cls: "vault-search-meta", text: meta.join(" — ") });

      if (doc.snippet) {
        const snEl = el.createDiv({ cls: "vault-search-snippet" });
        renderMatches(snEl, doc.snippet, findTermRanges(doc.snippet, this.highlightTerms));
      }

      el.addEventListener("mouseenter", () => this._setActive(i, true));
      el.addEventListener("click", () => {
        this._setActive(i, false);
        this._openActive();
      });
    });
  }

  _moveActive(delta) {
    if (this.results.length === 0) return;
    let next = this.activeIndex + delta;
    if (next < 0) next = this.results.length - 1;
    if (next >= this.results.length) next = 0;
    this._setActive(next, true);
  }

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
    const file = this.app.vault.getFileByPath(doc.notePath);
    if (!file) {
      this._setPreviewPlaceholder("Datei nicht gefunden (verschoben/gelöscht?).");
      return;
    }

    if (this._previewComponent) {
      this._previewComponent.unload();
      this._previewComponent = null;
    }
    this.previewEl.empty();
    this.previewEl.removeClass("vault-search-preview-empty");

    let raw = "";
    try {
      raw = await this.app.vault.cachedRead(file);
    } catch (e) {
      raw = "";
    }
    if (token !== this._previewToken) return;

    const component = new Component();
    component.load();
    this._previewComponent = component;
    try {
      await MarkdownRenderer.render(this.app, raw, this.previewEl, file.path, component);
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
    const file = this.app.vault.getFileByPath(doc.notePath);
    if (!file) return;
    this.close();
    this.app.workspace.getLeaf(false).openFile(file);
  }
}

// ---------------------------------------------------------------- plugin

export default class VaultSearchPlugin extends Plugin {
  onload() {
    this.engine = new SearchEngine(this.app, this.manifest?.dir);

    // Public API for other plugins (e.g. rag-chat) — unchanged contract
    // from v1, see retriever.ts's FuzzySearchApi. Pure data in, pure data
    // out - no UI/modal involved, safe to call from any context (including
    // non-interactive retrieval pipelines).
    this.api = {
      search: async (query, limit) => {
        const { results, correction } = await this.engine.search(query, limit);
        return { results, correction };
      },
    };

    this.app.workspace.onLayoutReady(() => {
      this.engine.ensureBuilt().catch((e) => console.error("vault-search: background index build failed", e));
    });

    this.addCommand({
      id: "open-vault-search",
      name: "Handbuch durchsuchen (gewichtet, tippfehler-/leerzeichentolerant)",
      hotkeys: [
        { modifiers: ["Mod", "Shift"], key: "F" },
        { modifiers: ["Ctrl"], key: "Space" },
      ],
      callback: () => {
        new VaultSearchModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: "reload-vault-search-index",
      name: "Suchindex neu aufbauen",
      callback: async () => {
        const notice = new Notice("Vault Search: Suchindex wird neu aufgebaut …", 0);
        try {
          await this.engine.rebuild();
          notice.hide();
          new Notice(`Vault Search: Suchindex neu aufgebaut (${this.engine.db ? "ok" : "?"}).`, 4000);
        } catch (e) {
          notice.hide();
          console.error("vault-search: reload index failed", e);
          new Notice("Vault Search: Neuaufbau fehlgeschlagen (siehe Konsole).", 6000);
        }
      },
    });
  }
}
