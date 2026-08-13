import { Plugin, Notice } from "obsidian";
import { SearchEngine } from "./engine/search-engine.js";
import { VaultSearchModal } from "./modal/vault-search-modal.js";

/**
 * Obsidian plugin entry point: builds the search engine, registers the
 * search/reload commands, and exposes a minimal `api.search()` for other
 * plugins (e.g. rag-chat's fuzzy search leg).
 */
export default class VaultSearchPlugin extends Plugin {
  onload() {
    this.engine = new SearchEngine(this.app, this.manifest?.dir);
    this.api = this._buildApi();

    this.app.workspace.onLayoutReady(() => {
      this.engine.ensureBuilt().catch((error) => console.error("vault-search: background index build failed", error));
    });

    this._registerCommands();
  }

  /**
   * @returns {{search: (query: string, limit?: number) => Promise<{results: object[], correction: object|null}>}}
   */
  _buildApi() {
    return {
      search: async (query, limit) => {
        const { results, correction } = await this.engine.search(query, limit);
        return { results, correction };
      },
    };
  }

  _registerCommands() {
    this.addCommand({
      id: "open-vault-search",
      name: "Handbuch durchsuchen (gewichtet, tippfehler-/leerzeichentolerant)",
      hotkeys: [
        { modifiers: ["Mod", "Shift"], key: "F" },
        { modifiers: ["Ctrl"], key: "Space" },
      ],
      callback: () => {
        new VaultSearchModal(this.app, this).open();
      },
    });

    this.addCommand({
      id: "reload-vault-search-index",
      name: "Suchindex neu aufbauen",
      callback: () => this._reloadIndex(),
    });
  }

  async _reloadIndex() {
    const notice = new Notice("Vault Search: Suchindex wird neu aufgebaut …", 0);
    try {
      await this.engine.rebuild();
      notice.hide();
      new Notice(`Vault Search: Suchindex neu aufgebaut (${this.engine.db ? "ok" : "?"}).`, 4000);
    } catch (error) {
      notice.hide();
      console.error("vault-search: reload index failed", error);
      new Notice("Vault Search: Neuaufbau fehlgeschlagen (siehe Konsole).", 6000);
    }
  }
}
