"use strict";

const { Plugin } = require("obsidian");

const STYLE_ID = "hide-excluded-paths-style";
// Scope every rule to the file explorer leaf so nothing else (embeds,
// backlinks, editor content, etc.) is ever affected.
const SCOPE = '.workspace-leaf-content[data-type="file-explorer"]';

// Escapes a value for safe use inside a CSS attribute selector string,
// e.g. [data-path="VALUE"].
function cssEscapeAttrValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// Mirrors Obsidian's own "Excluded files" (userIgnoreFilters) semantics:
//   - entries ending in "/"  -> folder, matched by exact vault-relative path
//   - entries containing "/" (no trailing slash) -> a specific file, matched
//     by its exact vault-relative path
//   - bare entries (no "/") -> a filename matched anywhere in the vault,
//     regardless of which folder it lives in
function buildRulesForEntry(rawEntry) {
  const entry = rawEntry.trim();
  if (!entry) return [];

  const rules = [];

  if (entry.endsWith("/")) {
    const folderPath = cssEscapeAttrValue(entry.slice(0, -1));
    const titleSelectors = [
      `${SCOPE} .nav-folder-title[data-path="${folderPath}"]`,
      `${SCOPE} .tree-item-self[data-path="${folderPath}"]`,
    ];
    // Hiding the title row is not enough - the expanded contents live in a
    // sibling container, so hide that too (this collapses the whole subtree
    // in one shot, no recursion into descendants needed).
    const childrenSelectors = [
      `${SCOPE} .nav-folder-title[data-path="${folderPath}"] ~ .nav-folder-children`,
      `${SCOPE} .tree-item-self[data-path="${folderPath}"] ~ .tree-item-children`,
    ];
    rules.push(`${titleSelectors.join(",\n")} {\n  display: none !important;\n}`);
    rules.push(`${childrenSelectors.join(",\n")} {\n  display: none !important;\n}`);
    return rules;
  }

  const escaped = cssEscapeAttrValue(entry);
  const fileSelectors = entry.includes("/")
    ? [
        `${SCOPE} .nav-file-title[data-path="${escaped}"]`,
        `${SCOPE} .tree-item-self[data-path="${escaped}"]`,
      ]
    : [
        `${SCOPE} .nav-file-title[data-path="${escaped}"]`,
        `${SCOPE} .nav-file-title[data-path$="/${escaped}"]`,
        `${SCOPE} .tree-item-self[data-path="${escaped}"]`,
        `${SCOPE} .tree-item-self[data-path$="/${escaped}"]`,
      ];
  rules.push(`${fileSelectors.join(",\n")} {\n  display: none !important;\n}`);
  return rules;
}

function buildCss(entries) {
  const rules = entries.flatMap(buildRulesForEntry);
  if (rules.length === 0) return "";
  return rules.join("\n\n") + "\n";
}

module.exports = class HideExcludedPathsPlugin extends Plugin {
  onload() {
    // Reuses the same list configured in Settings -> Files and Links ->
    // Excluded files (stored as userIgnoreFilters in app.json), so there is
    // a single list to maintain even though core Obsidian's own enforcement
    // of it is unreliable for folders and markdown files in this vault.
    const entries = this.app.vault.getConfig("userIgnoreFilters") || [];

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = buildCss(entries);
    document.head.appendChild(style);
    this.register(() => {
      const existing = document.getElementById(STYLE_ID);
      if (existing) existing.remove();
    });
  }

  onunload() {
    const existing = document.getElementById(STYLE_ID);
    if (existing) existing.remove();
  }
};
