import { Modal } from "obsidian";
import { RESULT_LIMIT } from "../engine/search-engine.js";
import { renderResultList } from "./result-list.js";
import { PreviewPane } from "./preview-pane.js";

const QUERY_DEBOUNCE_MS = 120;
const PREVIEW_DEBOUNCE_MS = 80;

/**
 * The search modal: a text input, a ranked result list, and a live
 * markdown preview of the highlighted result.
 */
export class VaultSearchModal extends Modal {
  /**
   * @param {import("obsidian").App} app
   * @param {{engine: object}} plugin
   */
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
    this._queryToken = 0;
    this._queryTimer = null;
  }

  onOpen() {
    this.modalEl.addClass("vault-search-modal");
    this.contentEl.addClass("vault-search-content");

    const leftEl = this.contentEl.createDiv({ cls: "vault-search-left" });
    this.inputEl = leftEl.createEl("input", {
      cls: "vault-search-input",
      attr: {
        type: "text",
        placeholder: "Suche im Handbuch (Titel > Tags > Inhalt, tippfehler-/leerzeichentolerant)…",
        spellcheck: "false",
      },
    });
    this.listEl = leftEl.createDiv({ cls: "vault-search-list" });

    const previewEl = this.contentEl.createDiv({ cls: "vault-search-preview markdown-rendered" });
    this.previewPane = new PreviewPane(this.app, previewEl);
    this.previewPane.showPlaceholder("");

    this._registerInputHandlers();
    this._startInitialQuery();

    window.setTimeout(() => this.inputEl.focus(), 0);
  }

  onClose() {
    if (this._queryTimer) window.clearTimeout(this._queryTimer);
    if (this._previewTimer) window.clearTimeout(this._previewTimer);
    this.previewPane?.dispose();
    this.contentEl.empty();
  }

  _startInitialQuery() {
    if (this.engine.ready) {
      this._onQueryChanged();
      return;
    }

    this.listEl.setText("Baue Suchindex …");
    this.engine
      .ensureBuilt()
      .then(() => this._onQueryChanged())
      .catch((error) => {
        console.error("vault-search: index build failed", error);
        this.listEl.setText("Indexaufbau fehlgeschlagen (siehe Konsole).");
      });
  }

  _registerInputHandlers() {
    this.inputEl.addEventListener("input", () => this._scheduleQueryChanged());
    this.scope.register([], "ArrowDown", (event) => {
      event.preventDefault();
      this._moveActive(1);
      return false;
    });
    this.scope.register([], "ArrowUp", (event) => {
      event.preventDefault();
      this._moveActive(-1);
      return false;
    });
    this.scope.register([], "Enter", (event) => {
      event.preventDefault();
      this._openActive();
      return false;
    });
  }

  _scheduleQueryChanged() {
    if (this._queryTimer) window.clearTimeout(this._queryTimer);
    this._queryTimer = window.setTimeout(() => {
      this._queryTimer = null;
      this._onQueryChanged();
    }, QUERY_DEBOUNCE_MS);
  }

  async _onQueryChanged() {
    if (!this.engine.ready) return;

    const rawQuery = this.inputEl.value || "";
    const token = ++this._queryToken;
    const shouldAbort = () => token !== this._queryToken;

    const { results, correction, expandedTerms } = await this.engine.search(rawQuery, RESULT_LIMIT, shouldAbort);
    if (shouldAbort()) return;

    this.results = results;
    this.correction = correction;
    this.highlightTerms = expandedTerms;
    this._renderList();

    if (this.results.length > 0) {
      this._setActive(0, true);
    } else {
      this.activeIndex = -1;
      this.previewPane.showPlaceholder(rawQuery.trim() ? "Keine Treffer." : "");
    }
  }

  _renderList() {
    this.rowEls = renderResultList({
      listEl: this.listEl,
      results: this.results,
      highlightTerms: this.highlightTerms,
      correction: this.correction,
      onHover: (index) => this._setActive(index, true),
      onSelect: (index) => {
        this._setActive(index, false);
        this._openActive();
      },
    });
  }

  /** @param {number} delta */
  _moveActive(delta) {
    if (this.results.length === 0) return;
    let next = this.activeIndex + delta;
    if (next < 0) next = this.results.length - 1;
    if (next >= this.results.length) next = 0;
    this._setActive(next, true);
  }

  /**
   * @param {number} index
   * @param {boolean} shouldPreview
   */
  _setActive(index, shouldPreview) {
    if (index < 0 || index >= this.results.length) return;

    if (this.activeIndex >= 0 && this.rowEls[this.activeIndex]) {
      this.rowEls[this.activeIndex].removeClass("is-active");
    }
    this.activeIndex = index;

    const rowEl = this.rowEls[index];
    if (rowEl) {
      rowEl.addClass("is-active");
      rowEl.scrollIntoView({ block: "nearest" });
    }
    if (shouldPreview) this._schedulePreview(this.results[index]);
  }

  /** @param {object} doc */
  _schedulePreview(doc) {
    if (this._previewTimer) window.clearTimeout(this._previewTimer);
    this._previewTimer = window.setTimeout(() => {
      this._previewTimer = null;
      const file = this.app.vault.getFileByPath(doc.notePath);
      this.previewPane.renderNote(file);
    }, PREVIEW_DEBOUNCE_MS);
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
