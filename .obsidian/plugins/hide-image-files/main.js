"use strict";

const { Plugin } = require("obsidian");

const STYLE_ID = "hide-image-files-style";
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

function buildCss() {
  // Case-insensitive suffix match on the data-path attribute, STRICTLY scoped
  // to the file-explorer leaf so rendered image embeds in notes can never be
  // matched. Target both .nav-file-title (default explorer) and .tree-item-self
  // (theme variants) inside the explorer container only.
  const scope = '.workspace-leaf-content[data-type="file-explorer"]';
  const selectors = [];
  for (const ext of EXTENSIONS) {
    selectors.push(`${scope} .nav-file-title[data-path$="${ext}" i]`);
    selectors.push(`${scope} .tree-item-self[data-path$="${ext}" i]`);
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
