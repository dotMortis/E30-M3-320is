import { defineConfig } from "vite";

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
        footer: "module.exports = module.exports.default;",
      },
    },
    minify: true,
  },
});
