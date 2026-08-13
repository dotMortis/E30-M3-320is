import { renderMatches } from "obsidian";
import { findTermRanges } from "../highlight.js";

/**
 * @param {HTMLElement} rowEl
 * @param {object} doc
 * @param {string[]} highlightTerms
 */
function renderTitle(rowEl, doc, highlightTerms) {
  const titleEl = rowEl.createDiv({ cls: "vault-search-title" });
  if (doc.seitencode) {
    renderMatches(titleEl, doc.seitencode, findTermRanges(doc.seitencode, highlightTerms));
    titleEl.appendText(" · ");
  }
  const titleText = doc.titel || doc.notePath;
  renderMatches(titleEl, titleText, findTermRanges(titleText, highlightTerms));
}

/**
 * @param {HTMLElement} rowEl
 * @param {object} doc
 * @param {{to: string}|null} correction
 */
function renderMeta(rowEl, doc, correction) {
  const meta = [];
  if (doc.sektion) meta.push(doc.sektion);
  if (correction) meta.push(`(meintest du „${correction.to}"?)`);
  if (meta.length > 0) rowEl.createDiv({ cls: "vault-search-meta", text: meta.join(" — ") });
}

/**
 * @param {HTMLElement} rowEl
 * @param {object} doc
 * @param {string[]} highlightTerms
 */
function renderSnippet(rowEl, doc, highlightTerms) {
  if (!doc.snippet) return;
  const snippetEl = rowEl.createDiv({ cls: "vault-search-snippet" });
  renderMatches(snippetEl, doc.snippet, findTermRanges(doc.snippet, highlightTerms));
}

/**
 * Renders the list of search result rows into `listEl`.
 * @param {object} params
 * @param {HTMLElement} params.listEl
 * @param {object[]} params.results
 * @param {string[]} params.highlightTerms
 * @param {{to: string}|null} params.correction
 * @param {(index: number) => void} params.onHover
 * @param {(index: number) => void} params.onSelect
 * @returns {HTMLElement[]} the created row elements, in result order
 */
export function renderResultList({ listEl, results, highlightTerms, correction, onHover, onSelect }) {
  listEl.empty();
  const rowEls = [];

  results.forEach((doc, index) => {
    const rowEl = listEl.createDiv({ cls: "vault-search-suggestion" });
    rowEls.push(rowEl);

    renderTitle(rowEl, doc, highlightTerms);
    renderMeta(rowEl, doc, correction);
    renderSnippet(rowEl, doc, highlightTerms);

    rowEl.addEventListener("mouseenter", () => onHover(index));
    rowEl.addEventListener("click", () => onSelect(index));
  });

  return rowEls;
}
