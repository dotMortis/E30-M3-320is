// vitest.config.mjs — test runner config for vault-search's algorithmic core
// (german.js, schema.js, search.js, highlight.js) plus a lightweight
// Modal smoke test in main.js. Deliberately minimal: no jsdom, no plugins -
// the code under test has no DOM/Obsidian dependency except main.js, which
// is exercised via a hand-rolled `obsidian` mock (see
// src/__tests__/mocks/obsidian.js) rather than a real DOM environment.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.js"],
    reporters: ["default"],
  },
});
