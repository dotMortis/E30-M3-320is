/**
 * @param {Array} notes
 * @param {object} [opts]
 * @returns {object} a fake Obsidian `app` object
 */
export function createFakeApp(notes, opts = {}) {
  const { dataFiles = {}, glossaryRaw = null, dataReadShouldFail = false, readDelayByPath = {} } = opts;

  const files = notes.map((note) => ({ path: note.notePath, basename: note.titel || note.notePath }));
  const cacheByPath = new Map(
    notes.map((note) => [
      note.notePath,
      {
        frontmatter: {
          titel: note.titel,
          titel_en: note.titleEn,
          sektion: note.section,
          seitencode: note.code,
          tags: note.tags,
        },
      },
    ])
  );
  const contentByPath = new Map(notes.map((note) => [note.notePath, note.content]));

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
