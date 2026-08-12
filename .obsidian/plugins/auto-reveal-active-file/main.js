"use strict";

const { Plugin } = require("obsidian");

const REVEAL_COMMAND_ID = "file-explorer:reveal-active-file";

module.exports = class AutoRevealActiveFilePlugin extends Plugin {
  onload() {
    // Reveal whenever a file is opened (tab switch / link click / quick switcher).
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => this.revealActiveFile(file))
    );

    // Reveal the initially-open file once the layout is ready on startup.
    this.app.workspace.onLayoutReady(() => {
      const file = this.app.workspace.getActiveFile();
      if (file) this.revealActiveFile(file);
    });
  }

  revealActiveFile(file) {
    if (!file) return;

    // Remember the leaf that currently holds keyboard focus (the editor).
    const previousLeaf = this.app.workspace.activeLeaf;

    // Defer so the reveal command runs after the file-open settles, then
    // restore editor focus so the sidebar never steals keyboard context
    // (prevents the accidental "Delete acts on the tree" race).
    window.setTimeout(() => {
      try {
        const commands = this.app.commands;
        if (!commands || typeof commands.executeCommandById !== "function") return;
        if (!commands.commands || !commands.commands[REVEAL_COMMAND_ID]) return;

        commands.executeCommandById(REVEAL_COMMAND_ID);

        if (previousLeaf) {
          this.app.workspace.setActiveLeaf(previousLeaf, { focus: true });
        }
      } catch (e) {
        console.error("auto-reveal-active-file: failed to reveal", e);
      }
    }, 0);
  }
};
