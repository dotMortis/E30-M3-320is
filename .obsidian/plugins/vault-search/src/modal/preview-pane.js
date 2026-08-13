import { Component, MarkdownRenderer } from "obsidian";

/**
 * Manages the markdown preview pane: renders a note's content, shows a
 * placeholder when there's nothing to preview, and disposes the previous
 * render's Component before starting a new one.
 */
export class PreviewPane {
  /**
   * @param {import("obsidian").App} app
   * @param {HTMLElement} containerEl
   */
  constructor(app, containerEl) {
    this.app = app;
    this.containerEl = containerEl;
    this._component = null;
    this._renderToken = 0;
  }

  /** @param {string} text */
  showPlaceholder(text) {
    this._disposeComponent();
    this.containerEl.empty();
    this.containerEl.addClass("vault-search-preview-empty");
    if (text) this.containerEl.setText(text);
  }

  /**
   * Renders the given file's markdown content into the preview pane.
   * @param {import("obsidian").TFile|null} file
   * @returns {Promise<void>}
   */
  async renderNote(file) {
    const token = ++this._renderToken;

    if (!file) {
      this.showPlaceholder("Datei nicht gefunden (verschoben/gelöscht?).");
      return;
    }

    this._disposeComponent();
    this.containerEl.empty();
    this.containerEl.removeClass("vault-search-preview-empty");

    let raw = "";
    try {
      raw = await this.app.vault.cachedRead(file);
    } catch (error) {
      raw = "";
    }
    if (token !== this._renderToken) return;

    const component = new Component();
    component.load();
    this._component = component;

    try {
      await MarkdownRenderer.render(this.app, raw, this.containerEl, file.path, component);
    } catch (error) {
      console.error("vault-search: preview render failed", error);
      if (token === this._renderToken) {
        this.showPlaceholder("Vorschau konnte nicht gerendert werden.");
      }
    }
  }

  dispose() {
    this._disposeComponent();
  }

  _disposeComponent() {
    if (this._component) {
      this._component.unload();
      this._component = null;
    }
  }
}
