#!/usr/bin/env node
// build.mjs — esbuild bundle for vault-search v2 (see PLAN.md's Stage 2
// notes). Deliberately esbuild (not Vite) — this plugin is much smaller
// than rag-chat and isDesktopOnly:false (must stay pure JS/browser-safe,
// no Node built-ins), so a minimal bundler keeps the toolchain proportional.
// Bundles @orama/orama + @orama/stemmers in (not available in the Obsidian
// runtime); only `obsidian` is externalized.
import { build } from "esbuild";

await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  outfile: "main.js",
  format: "cjs",
  platform: "browser",
  target: "es2020",
  external: ["obsidian", "electron"],
  // esbuild's cjs output for `export default X` wraps it as
  // `module.exports = __toCommonJS(...)` with the class under `.default` -
  // Obsidian's plugin loader expects module.exports to BE the class
  // directly (confirmed against rag-chat's compiled main.js: plain
  // `module.exports = RagChatPlugin;`, not `.default`). This footer fixes
  // the export shape post-bundle without needing a heavier bundler config.
  footer: { js: "module.exports = module.exports.default;" },
  logLevel: "info",
});
