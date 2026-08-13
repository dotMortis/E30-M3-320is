import { defineConfig } from "vite";

// Vite/Rollup library-mode build for this Obsidian plugin, mirroring the
// sibling rag-chat plugin's vite.config.ts - replaces the previous
// bespoke esbuild script (build.mjs). Output: main.js written directly
// beside manifest.json (Obsidian's expected layout). @orama/* is bundled
// IN (not available in the Obsidian runtime); only `obsidian`/`electron`
// are externalized - this plugin doesn't touch Node builtins or
// CodeMirror/Lezer (unlike rag-chat), so those extra externals aren't
// needed here.
export default defineConfig({
  build: {
    outDir: ".",
    emptyOutDir: false,
    sourcemap: false,
    lib: {
      entry: "src/main.js",
      formats: ["cjs"],
      fileName: () => "main.js",
    },
    rollupOptions: {
      external: ["obsidian", "electron"],
      output: {
        // src/main.js has BOTH a default export (VaultSearchPlugin, what
        // Obsidian's plugin loader needs) and named exports (SearchEngine/
        // VaultSearchModal, exported solely so __tests__/*.test.js can
        // import them directly). Rollup's cjs output for that mix puts the
        // default export under `exports.default` rather than making
        // module.exports BE the class - Obsidian's loader expects
        // module.exports to be the class directly (confirmed against
        // rag-chat's compiled main.js too, and the same reasoning the old
        // esbuild-based build.mjs documented). This footer fixes the
        // export shape post-bundle.
        footer: "module.exports = module.exports.default;",
      },
    },
    // Deliberately minified (unlike rag-chat's minify:false) - this
    // plugin's whole point is being lightweight on less capable devices
    // (see the vault-search optimization work), so shaving parse/download
    // size further is directly in scope, not just a default left in place.
    minify: true,
  },
});
