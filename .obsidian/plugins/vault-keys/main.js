"use strict";

const { Plugin, PluginSettingTab, Setting, Notice } = require("obsidian");

// ---------------------------------------------------------------------------
// Vault Keys
//
// A settings-only plugin: lets you paste/edit the API keys used by the
// .pipeline/scripts/*.py RAG tooling (Gemini embeddings + OpenCode Zen
// generation) from inside Obsidian instead of hand-editing .env.
//
// It reads and writes the single .env file at the vault root -- the exact
// same file the Python scripts already load -- so there is one source of
// truth for both. It never touches any other line in .env (comments and
// unrelated variables are preserved verbatim).
// ---------------------------------------------------------------------------

const ENV_PATH = ".env";

// Keys this plugin knows how to manage, in display order.
const KEY_DEFS = [
  {
    key: "GEMINI_API_KEY",
    name: "Gemini API Key",
    desc: "Used by build_rag_index.py / rag_query.py to embed manual pages and questions (gemini-embedding-001, free tier).",
  },
  {
    key: "OPENCODE_API_KEY",
    name: "OpenCode Zen API Key",
    desc: "Used by the pipeline scripts (analyze.py, relate.py, rag_query.py) to call OpenCode Zen models for generation/analysis.",
  },
];

// Parse a .env file into raw lines, preserving everything (comments, blanks,
// unrelated vars) so round-tripping never clobbers unrelated content.
function splitLines(text) {
  return text ? text.split(/\r?\n/) : [];
}

function getEnvValue(lines, key) {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq).trim() === key) {
      return trimmed.slice(eq + 1).trim();
    }
  }
  return "";
}

function upsertEnvValue(lines, key, value) {
  let found = false;
  const out = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return line;
    if (trimmed.slice(0, eq).trim() === key) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) {
    // Drop trailing blank lines before appending so we don't accumulate gaps.
    while (out.length && out[out.length - 1] === "") out.pop();
    out.push(`${key}=${value}`);
  }
  return out;
}

module.exports = class VaultKeysPlugin extends Plugin {
  async onload() {
    this.addSettingTab(new VaultKeysSettingTab(this.app, this));
  }

  async readEnvLines() {
    const adapter = this.app.vault.adapter;
    try {
      if (await adapter.exists(ENV_PATH)) {
        const text = await adapter.read(ENV_PATH);
        return splitLines(text);
      }
    } catch (e) {
      console.error("vault-keys: failed to read .env", e);
    }
    return [];
  }

  async writeEnvLines(lines) {
    const adapter = this.app.vault.adapter;
    const text = lines.join("\n") + (lines.length ? "\n" : "");
    await adapter.write(ENV_PATH, text);
  }

  async getKey(key) {
    const lines = await this.readEnvLines();
    return getEnvValue(lines, key);
  }

  async setKey(key, value) {
    const lines = await this.readEnvLines();
    const updated = upsertEnvValue(lines, key, value);
    await this.writeEnvLines(updated);
  }
};

class VaultKeysSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Vault Keys" });
    containerEl.createEl("p", {
      text:
        "API keys for the RAG tooling (.pipeline/scripts/build_rag_index.py, rag_query.py). " +
        "Saved into .env at the vault root, which is git-ignored and never committed.",
    });

    for (const def of KEY_DEFS) {
      const currentValue = await this.plugin.getKey(def.key);
      let pendingValue = currentValue;
      let inputEl;

      const setting = new Setting(containerEl)
        .setName(def.name)
        .setDesc(def.desc)
        .addText((text) => {
          inputEl = text.inputEl;
          inputEl.type = "password";
          inputEl.style.width = "22em";
          text.setPlaceholder(`${def.key}=...`).setValue(currentValue);
          text.onChange((value) => {
            pendingValue = value;
          });
          // Save on blur (not on every keystroke) to avoid hammering the
          // filesystem, but still catch paste-then-tab-away and Enter.
          inputEl.addEventListener("blur", () => this.save(def, pendingValue));
          inputEl.addEventListener("keydown", (evt) => {
            if (evt.key === "Enter") {
              evt.preventDefault();
              inputEl.blur();
            }
          });
        })
        .addExtraButton((btn) =>
          btn
            .setIcon("eye")
            .setTooltip("Show/hide")
            .onClick(() => {
              inputEl.type = inputEl.type === "password" ? "text" : "password";
            })
        );

      setting.settingEl.addClass("vault-keys-setting");
    }
  }

  async save(def, value) {
    const trimmed = (value || "").trim();
    try {
      await this.plugin.setKey(def.key, trimmed);
      new Notice(`${def.name} gespeichert.`);
    } catch (e) {
      console.error("vault-keys: failed to save key", def.key, e);
      new Notice(`Fehler beim Speichern von ${def.name}. Siehe Konsole.`);
    }
  }

  hide() {
    this.containerEl.empty();
  }
}
