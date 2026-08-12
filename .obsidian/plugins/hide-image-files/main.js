"use strict";

const { Plugin } = require("obsidian");

const STYLE_ID = "hide-image-files-style";
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

function buildCss() {
  // Case-insensitive suffix match on the data-path attribute. Target both
  // .nav-file-title (default explorer) and .tree-item-self (theme variants)
  // so image files are hidden from the file explorer tree regardless of theme.
  // Only the explorer listing is affected; images embedded in notes still render.
  const selectors = [];
  for (const ext of EXTENSIONS) {
    selectors.push(`.nav-file-title[data-path$="${ext}" i]`);
    selectors.push(`.tree-item-self[data-path$="${ext}" i]`);
  }
  return `${selectors.join(",\n")} {\n  display: none !important;\n}\n`;
}

module.exports = class HideImageFilesPlugin extends Plugin {
  onload() {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = buildCss();
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
