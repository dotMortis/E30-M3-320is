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
// Small, vault-filtered derivatives of OpenThesaurus + all-the-german-words
// (see scripts/build-data.mjs) - bundled directly rather than the raw
// multi-megabyte generic datasets, which never enter this bundle at all.
import openThesaurusPairs from "../data/synonyms.json";
import compoundParts from "../data/compound-parts.json";

const RESULT_LIMIT = 50;
const PREVIEW_DEBOUNCE_MS = 80;

// -------------------------------------------------------------- index build

class SearchEngine {
  constructor(app) {
    this.app = app;
    this.db = null;
    this.vocabulary = new Set();
    this.contentByRowId = new Map();
    this.synonymMap = new Map();
    this.dict = new Set();
    this.compoundParts = {};
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

  async rebuild() {
    this.ready = false;
    this.db = null;
    this.vocabulary = new Set();
    this.contentByRowId = new Map();
    await this.ensureBuilt();
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

  async _build() {
    const t0 = Date.now();
    const glossaryTerms = await this._loadGlossaryTerms();
    this.synonymMap = buildSynonymMap(glossaryTerms, openThesaurusPairs);
    this.compoundParts = compoundParts;

    const mdFiles = this.app.vault.getMarkdownFiles();
    const docs = [];
    const titleAndTagTokenLists = [];
    const rawByRowId = new Map();

    for (const file of mdFiles) {
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

      const rowId = file.path;
      docs.push({ rowId, notePath: file.path, code, titel, titleEn, section, tags, content });
      rawByRowId.set(rowId, content);

      titleAndTagTokenLists.push(tokenize(titel));
      titleAndTagTokenLists.push(tokenize(titleEn));
      titleAndTagTokenLists.push(tokenize(section));
      for (const tag of tags) titleAndTagTokenLists.push(tokenize(tag));

      for (const tok of tokenize(titel)) this.vocabulary.add(tok);
      for (const tok of tokenize(titleEn)) this.vocabulary.add(tok);
      for (const tag of tags) for (const tok of tokenize(tag)) this.vocabulary.add(tok);
      // Content tokens too (not just title/tags) - this vocabulary set also
      // gates query-side synthesis (synthesizeSeparableVerbs/
      // synthesizeJoinedCompounds in german.js), which needs to validate
      // candidates against real corpus words wherever they appear, not just
      // in titles (many repair-verb infinitives only appear in body text).
      for (const tok of tokenize(content)) this.vocabulary.add(tok);
    }

    this.dict = buildDictionary(titleAndTagTokenLists, this.synonymMap);
    this.contentByRowId = rawByRowId;

    this.db = await createIndex();
    await insertDocs(this.db, docs);

    this.ready = true;
    const ms = Date.now() - t0;
    console.log(`vault-search: indexed ${docs.length} notes, ${this.vocabulary.size} vocab tokens, ${this.dict.size} dict words in ${ms}ms`);
  }

  async search(query, limit) {
    await this.ensureBuilt();
    return runSearch(
      this.db,
      query,
      limit ?? RESULT_LIMIT,
      this.vocabulary,
      this.contentByRowId,
      this.synonymMap,
      this.dict,
      this.compoundParts
    );
  }
}

// ---------------------------------------------------------------- the modal

class VaultSearchModal extends Modal {
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

  async _onQueryChanged() {
    if (!this.engine.ready) return;
    const raw = this.inputEl.value || "";
    const token = ++this._queryToken;
    const { results, correction, expandedTerms } = await this.engine.search(raw, RESULT_LIMIT);
    if (token !== this._queryToken) return; // a newer query superseded this one

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
    this.engine = new SearchEngine(this.app);

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
