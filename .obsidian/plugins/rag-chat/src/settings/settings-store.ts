import { Notice, type Plugin } from "obsidian";
import { decryptSecret, encryptSecret } from "../secure-storage";
import { DEFAULT_SETTINGS, type RagChatSettings } from "./types";

interface SecretCache {
  plaintext: string | undefined;
  ciphertext: string | undefined;
}

export class SettingsStore {
  settings!: RagChatSettings;
  private geminiKeyCache: SecretCache = { plaintext: undefined, ciphertext: undefined };
  private ttsKeyCache: SecretCache = { plaintext: undefined, ciphertext: undefined };

  constructor(private readonly plugin: Plugin) {}

  async load(): Promise<void> {
    const raw = ((await this.plugin.loadData()) ?? {}) as Record<string, unknown>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw) as RagChatSettings;

    this.settings.geminiApiKey = await this.loadSecret(
      raw.geminiApiKey as string | undefined,
      this.geminiKeyCache,
      "Google API key (GEMINI_API_KEY)",
    );
    this.settings.ttsApiKey = await this.loadSecret(
      raw.ttsApiKey as string | undefined,
      this.ttsKeyCache,
      "TTS API-Key",
    );
  }

  async save(): Promise<void> {
    const toPersist: Record<string, unknown> = { ...this.settings };
    toPersist.geminiApiKey = await this.persistSecret(this.settings.geminiApiKey, this.geminiKeyCache);
    toPersist.ttsApiKey = await this.persistSecret(this.settings.ttsApiKey, this.ttsKeyCache);
    await this.plugin.saveData(toPersist);
  }

  private async loadSecret(stored: string | undefined, cache: SecretCache, label: string): Promise<string> {
    try {
      const plaintext = await decryptSecret(stored);
      cache.plaintext = plaintext;
      cache.ciphertext = stored;
      return plaintext;
    } catch {
      cache.plaintext = undefined;
      cache.ciphertext = undefined;
      if (stored) {
        new Notice(
          `RAG Chat: ${label} konnte nicht entschlüsselt werden (anderes Gerät oder beschädigte Daten?) - bitte in den Einstellungen erneut eingeben.`,
          10000,
        );
      }
      return "";
    }
  }

  private async persistSecret(plaintext: string, cache: SecretCache): Promise<string> {
    if (plaintext === cache.plaintext && cache.ciphertext !== undefined) {
      return cache.ciphertext;
    }
    const ciphertext = await encryptSecret(plaintext);
    cache.plaintext = plaintext;
    cache.ciphertext = ciphertext;
    return ciphertext;
  }
}
