/**
 * mocks/fakeVault.js — minimal fake `app` (vault + metadataCache) for
 * exercising SearchEngine._build() (see ../../main.js) end-to-end without
 * a real Obsidian vault. Complements mocks/obsidian.js (which fakes the
 * `obsidian` module's UI primitives) - this fakes the `app` object a
 * Plugin instance receives.
 *
 * `notes` are shaped like ../fixtures/notes.js's fixture docs ({ rowId,
 * notePath, code, titel, titleEn, section, tags, content }); `content` is
 * treated as already-plain text (no frontmatter/markdown stripping
 * needed - metadataCache.getFileCache() is faked to return the note's
 * fields directly, mirroring what Obsidian's real frontmatter parser
 * would hand back for a note authored with `titel`/`titel_en`/`sektion`/
 * `seitencode`/`tags` frontmatter keys - see main.js:82-89).
 */
export function createFakeApp(notes, opts = {}) {
  const { dataFiles = {}, glossaryRaw = null, dataReadShouldFail = false, readDelayByPath = {} } = opts;

  const files = notes.map((n) => ({ path: n.notePath, basename: n.titel || n.notePath }));
  const cacheByPath = new Map(
    notes.map((n) => [
      n.notePath,
      {
        frontmatter: {
          titel: n.titel,
          titel_en: n.titleEn,
          sektion: n.section,
          seitencode: n.code,
          tags: n.tags,
        },
      },
    ])
  );
  const contentByPath = new Map(notes.map((n) => [n.notePath, n.content]));

  return {
    vault: {
      getMarkdownFiles: () => files,
      cachedRead: async (file) => {
        const delay = readDelayByPath[file.path] || 0;
        if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
        return contentByPath.get(file.path) ?? "";
      },
      adapter: {
        read: async (path) => {
          if (dataReadShouldFail) throw new Error("simulated read failure");
          if (path.endsWith(".pipeline/glossary.json")) {
            if (glossaryRaw === null) throw new Error("glossary.json not found (simulated)");
            return glossaryRaw;
          }
          for (const [suffix, value] of Object.entries(dataFiles)) {
            if (path.endsWith(suffix)) return JSON.stringify(value);
          }
          throw new Error(`fakeVault: no data registered for path "${path}"`);
        },
      },
    },
    metadataCache: {
      getFileCache: (file) => cacheByPath.get(file.path) || {},
    },
  };
}
