/**
 * Reads and parses the vault-wide glossary file, used to seed additional
 * synonym pairs. Returns an empty array if the file is missing or invalid.
 * @param {import("obsidian").App} app
 * @returns {Promise<Array<{de?: string, en?: string, variants?: string[]}>>}
 */
export async function loadGlossaryTerms(app) {
  try {
    const raw = await app.vault.adapter.read(".pipeline/glossary.json");
    const glossary = JSON.parse(raw);
    return Array.isArray(glossary.terms) ? glossary.terms : [];
  } catch (error) {
    console.log("vault-search: glossary.json not available, using colloquial synonyms only");
    return [];
  }
}

/**
 * Reads and parses a JSON data file from this plugin's own folder. Falls
 * back to `fallback` (without throwing) if the file is missing or invalid.
 * @param {import("obsidian").App} app
 * @param {string} pluginDir
 * @param {string} relativePath
 * @param {*} fallback
 * @returns {Promise<*>}
 */
export async function loadPluginJsonFile(app, pluginDir, relativePath, fallback) {
  try {
    const raw = await app.vault.adapter.read(`${pluginDir}/${relativePath}`);
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`vault-search: could not load ${relativePath}, continuing without it`, error);
    return fallback;
  }
}
