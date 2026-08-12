"use strict";

const { Plugin } = require("obsidian");

const LOCAL_GRAPH_TYPE = "localgraph";

module.exports = class ShowLocalGraphPlugin extends Plugin {
  onload() {
    // Ensure a local graph view is present in the right sidebar once the
    // workspace layout is ready. This makes the local graph appear by default
    // for every user of the vault, independent of the per-user (gitignored)
    // workspace.json state.
    this.app.workspace.onLayoutReady(() => this.ensureLocalGraph());
  }

  ensureLocalGraph() {
    try {
      const workspace = this.app.workspace;

      // If a local graph leaf already exists, don't create a duplicate.
      const existing = workspace.getLeavesOfType(LOCAL_GRAPH_TYPE);
      if (existing && existing.length > 0) return;

      const leaf = workspace.getRightLeaf(false);
      if (!leaf) return;

      leaf.setViewState({ type: LOCAL_GRAPH_TYPE, active: false }).then(() => {
        // Reveal the sidebar leaf without stealing focus from the editor.
        workspace.revealLeaf(leaf);
      });
    } catch (e) {
      console.error("show-local-graph: failed to open local graph", e);
    }
  }
};
