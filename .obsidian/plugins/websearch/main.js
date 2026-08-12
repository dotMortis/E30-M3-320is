"use strict";

const { Plugin, Modal, Notice } = require("obsidian");

// ---------------------------------------------------------------------------
// Websearch
//
// Adds a ribbon button ("KI-Websuche"). Clicking it while a note is open
// shows a modal with a textarea. On submit, the user's prompt is combined
// with the active note's context (fixed "BMW E30 M3" tag plus frontmatter
// `sektion` / `seitencode`, or the filename as a fallback) into a Google
// search query, which is opened in the OS default browser.
// ---------------------------------------------------------------------------

const FIXED_CONTEXT = "BMW E30 M3";
const RIBBON_ICON_ID = "sparkles";
const RIBBON_TOOLTIP = "KI-Websuche";
const RIBBON_ICON_CLASS = "websearch-ribbon-icon";

class WebsearchModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("websearch-modal-content");

    const headingEl = contentEl.createEl("h3", { cls: "websearch-heading" });
    headingEl.createSpan({ cls: "websearch-sparkle-emoji", text: "✨" });
    headingEl.createSpan({ text: " KI-Websuche " });
    headingEl.createSpan({ cls: "websearch-sparkle-emoji", text: "✨" });

    contentEl.createEl("p", {
      cls: "websearch-subtext",
      text: "Frage stellen \u2013 wird zusammen mit dem Seitenkontext gesucht.",
    });

    this.textAreaEl = contentEl.createEl("textarea", {
      cls: "websearch-textarea",
      attr: {
        rows: "6",
        placeholder: "Frage eingeben\u2026",
        spellcheck: "true",
      },
    });

    const buttonRow = contentEl.createDiv({ cls: "websearch-button-row" });
    const searchBtn = buttonRow.createEl("button", {
      cls: "mod-cta websearch-search-btn",
      text: "Suchen",
    });
    searchBtn.addEventListener("click", () => this.submit());

    window.setTimeout(() => this.textAreaEl.focus(), 0);
  }

  submit() {
    const prompt = (this.textAreaEl.value || "").trim();
    if (!prompt) {
      new Notice("Bitte einen Text eingeben.");
      this.textAreaEl.focus();
      return;
    }

    const url = this.plugin.buildSearchUrl(prompt);
    window.open(url, "_blank");
    this.close();
  }

  onClose() {
    this.contentEl.empty();
  }
}

module.exports = class WebsearchPlugin extends Plugin {
  onload() {
    const ribbonIconEl = this.addRibbonIcon(RIBBON_ICON_ID, RIBBON_TOOLTIP, () => {
      this.openPromptModal();
    });
    ribbonIconEl.addClass(RIBBON_ICON_CLASS);

    this.addCommand({
      id: "open-ai-websearch",
      name: "KI-Websuche \u00f6ffnen",
      callback: () => this.openPromptModal(),
    });
  }

  openPromptModal() {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice("Keine aktive Seite ge\u00f6ffnet.");
      return;
    }
    new WebsearchModal(this.app, this).open();
  }

  buildSearchUrl(userPrompt) {
    const contextParts = [FIXED_CONTEXT];

    const file = this.app.workspace.getActiveFile();
    const cache = file ? this.app.metadataCache.getFileCache(file) : null;
    const frontmatter = (cache && cache.frontmatter) || {};

    if (frontmatter.titel) contextParts.push(String(frontmatter.titel));
    if (frontmatter.sektion) contextParts.push(String(frontmatter.sektion));

    if (contextParts.length === 1 && file) {
      contextParts.push(file.basename);
    }

    contextParts.push(userPrompt);

    const query = contextParts.join(" ");
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }
};
