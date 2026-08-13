import { defineConfig } from "vite";
import { builtinModules } from "node:module";

// Vite library-mode build for an Obsidian plugin (see PLAN.md Phase 4).
// Output: main.js written directly beside manifest.json (Obsidian's expected layout).
// @orama/* is bundled IN (it's not available in the Obsidian runtime); obsidian,
// electron, Node builtins, and CodeMirror packages (provided by the Obsidian app
// shell) are externalized.
export default defineConfig({
  build: {
    outDir: ".",
    emptyOutDir: false,
    sourcemap: false,
    lib: {
      entry: "src/main.ts",
      formats: ["cjs"],
      fileName: () => "main.js",
    },
    rollupOptions: {
      external: [
        "obsidian",
        "electron",
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        /^@codemirror\//,
        /^@lezer\//,
      ],
      output: {
        exports: "default",
      },
    },
    minify: false,
  },
});
