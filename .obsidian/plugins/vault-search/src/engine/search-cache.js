/**
 * A small fixed-size LRU cache keyed by an arbitrary string. Map's
 * insertion order doubles as recency order: re-inserting a key on access
 * moves it to the "most recently used" end.
 */
export class SearchResultCache {
  /** @param {number} maxEntries */
  constructor(maxEntries) {
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  /**
   * @param {string} key
   * @returns {*} the cached value, or undefined if absent
   */
  get(key) {
    if (!this.entries.has(key)) return undefined;
    const value = this.entries.get(key);
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  /**
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      this.entries.delete(oldestKey);
    }
  }

  clear() {
    this.entries.clear();
  }
}
