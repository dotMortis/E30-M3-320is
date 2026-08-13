import { runSearch } from "../search.js";
import { buildSearchIndex } from "./index-builder.js";
import { SearchResultCache } from "./search-cache.js";

/** Default number of results returned by a search. */
export const RESULT_LIMIT = 50;

const SEARCH_CACHE_MAX_ENTRIES = 20;
const DEFAULT_PLUGIN_DIR = ".obsidian/plugins/vault-search";

/**
 * Builds and queries the vault's search index. `ensureBuilt()`/`rebuild()`
 * manage the index lifecycle; `search()` is the main query entry point.
 */
export class SearchEngine {
  /**
   * @param {import("obsidian").App} app
   * @param {string} [pluginDir]
   */
  constructor(app, pluginDir) {
    this.app = app;
    this.pluginDir = pluginDir || DEFAULT_PLUGIN_DIR;
    this.db = null;
    this.vocabulary = new Set();
    this.contentByRowId = new Map();
    this.synonymMap = new Map();
    this.dict = new Set();
    this.compoundParts = {};
    this.ready = false;
    this.building = null;
    this._cache = new SearchResultCache(SEARCH_CACHE_MAX_ENTRIES);
  }

  /** Builds the index if it hasn't been built yet. Safe to call concurrently. */
  async ensureBuilt() {
    if (this.ready) return;
    if (this.building) return this.building;
    this.building = this._build();
    await this.building;
    this.building = null;
  }

  /** Discards the current index/cache and rebuilds from scratch. */
  async rebuild() {
    this.ready = false;
    this.db = null;
    this.vocabulary = new Set();
    this.contentByRowId = new Map();
    this._cache.clear();
    await this.ensureBuilt();
  }

  async _build() {
    const start = Date.now();
    const { db, vocabulary, contentByRowId, synonymMap, dict, compoundParts, noteCount } = await buildSearchIndex(
      this.app,
      this.pluginDir
    );

    this.db = db;
    this.vocabulary = vocabulary;
    this.contentByRowId = contentByRowId;
    this.synonymMap = synonymMap;
    this.dict = dict;
    this.compoundParts = compoundParts;
    this.ready = true;

    const elapsedMs = Date.now() - start;
    console.log(
      `vault-search: indexed ${noteCount} notes, ${vocabulary.size} vocab tokens, ${dict.size} dict words in ${elapsedMs}ms`
    );
  }

  /**
   * @param {string} query
   * @param {number} [limit]
   * @param {() => boolean} [shouldAbort]
   * @returns {Promise<{results: object[], correction: object|null, expandedTerms: string[]}>}
   */
  async search(query, limit, shouldAbort) {
    await this.ensureBuilt();
    const effectiveLimit = limit ?? RESULT_LIMIT;
    const cacheKey = `${effectiveLimit}:${(query || "").trim()}`;

    const cached = this._cache.get(cacheKey);
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

    if (!shouldAbort || !shouldAbort()) {
      this._cache.set(cacheKey, result);
    }
    return result;
  }
}
