import { Notice, type Plugin } from "obsidian";
import {
  decryptSecret,
  encryptSecret,
  isEncryptedSecret,
  isLegacySecret,
  verifyPassword,
} from "../secure-storage";
import { DEFAULT_SETTINGS, type RagChatSettings } from "./types";

/** Which settings fields hold password-protected secrets. */
export const SECRET_KEYS = ["geminiApiKey", "ttsApiKey"] as const;
export type SecretKey = (typeof SECRET_KEYS)[number];

export const SECRET_LABELS: Record<SecretKey, string> = {
  geminiApiKey: "Google API key (GEMINI_API_KEY)",
  ttsApiKey: "TTS API-Key",
};

export type PasswordPromptMode = "create" | "unlock";

export interface PasswordPromptRequest {
  mode: PasswordPromptMode;
  /** Which secret triggered the prompt, when it is about a single one. */
  label?: string;
  /** Shown inline, e.g. after a failed attempt. */
  error?: string;
}

/**
 * Asks the user for their password. Returns `null` when they cancel.
 * Injected so tests (and headless code paths) don't need a real modal.
 */
export type PasswordPrompt = (request: PasswordPromptRequest) => Promise<string | null>;

interface SecretState {
  /** Ciphertext currently on disk (`""` when no secret is stored). */
  ciphertext: string;
  /**
   * Plaintext as last loaded/saved, used to detect real edits. `undefined`
   * while a stored secret is still locked, so an untouched locked secret is
   * never mistaken for "user cleared it".
   */
  known: string | undefined;
  /** True once this secret's plaintext is available in `settings`. */
  unlocked: boolean;
}

function emptySecretState(): SecretState {
  return { ciphertext: "", known: undefined, unlocked: false };
}

export class SettingsStore {
  settings!: RagChatSettings;
  private secrets: Record<SecretKey, SecretState> = {
    geminiApiKey: emptySecretState(),
    ttsApiKey: emptySecretState(),
  };
  private promptPassword: PasswordPrompt | null = null;
  private lockListeners = new Set<() => void>();

  constructor(private readonly plugin: Plugin) {}

  /** Wires the UI that asks for passwords. Without it, secrets can't be saved. */
  setPasswordPrompt(prompt: PasswordPrompt | null): void {
    this.promptPassword = prompt;
  }

  /** Notifies listeners whenever lock state changes (see `isLocked`). */
  onLockStateChange(listener: () => void): () => void {
    this.lockListeners.add(listener);
    return () => this.lockListeners.delete(listener);
  }

  async load(): Promise<void> {
    const raw = ((await this.plugin.loadData()) ?? {}) as Record<string, unknown>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw) as RagChatSettings;

    for (const key of SECRET_KEYS) {
      const stored = raw[key];
      const state = emptySecretState();
      // Secrets always start locked: nothing is decrypted until the user
      // supplies the password.
      this.settings[key] = "";

      if (typeof stored === "string" && stored) {
        if (isEncryptedSecret(stored)) {
          state.ciphertext = stored;
        } else if (isLegacySecret(stored)) {
          // Encrypted by the old machine-fingerprint scheme; unrecoverable.
          // Drop it so the user is asked for a fresh key + password, and so
          // this dead blob can't linger and keep re-triggering the notice.
          state.known = "";
          new Notice(
            `RAG Chat: ${SECRET_LABELS[key]} stammt aus einer älteren Version und kann nicht mehr entschlüsselt werden - bitte in den Einstellungen erneut eingeben.`,
            10000,
          );
        } else {
          // Plaintext from a pre-encryption version (or hand-edited data.json).
          // Adopt it as the current value so the next save protects it.
          state.known = stored;
          state.unlocked = true;
          this.settings[key] = stored;
        }
      } else {
        // Nothing stored: there is no secret to unlock.
        state.known = "";
        state.unlocked = true;
      }
      this.secrets[key] = state;
    }
    this.notifyLockState();
  }

  async save(): Promise<void> {
    const toPersist: Record<string, unknown> = { ...this.settings };
    for (const key of SECRET_KEYS) {
      toPersist[key] = await this.resolveCiphertext(key);
    }
    await this.plugin.saveData(toPersist);
    this.notifyLockState();
  }

  /** True when at least one stored secret is still encrypted/unavailable. */
  isLocked(): boolean {
    return SECRET_KEYS.some((key) => this.isSecretLocked(key));
  }

  isSecretLocked(key: SecretKey): boolean {
    const state = this.secrets[key];
    return Boolean(state.ciphertext) && !state.unlocked;
  }

  /** True when any secret exists on disk (i.e. a password has been set). */
  hasProtectedSecrets(): boolean {
    return SECRET_KEYS.some((key) => Boolean(this.secrets[key].ciphertext));
  }

  /**
   * Tries to decrypt every locked secret with `password`. Each secret is
   * handled independently, so one bad/foreign blob can't keep the others
   * locked. Returns which secrets were unlocked and which failed.
   */
  async unlock(password: string): Promise<{ unlocked: SecretKey[]; failed: SecretKey[] }> {
    const unlocked: SecretKey[] = [];
    const failed: SecretKey[] = [];
    for (const key of SECRET_KEYS) {
      if (!this.isSecretLocked(key)) continue;
      const state = this.secrets[key];
      try {
        const plaintext = await decryptSecret(state.ciphertext, password);
        state.known = plaintext;
        state.unlocked = true;
        this.settings[key] = plaintext;
        unlocked.push(key);
      } catch {
        failed.push(key);
      }
    }
    if (unlocked.length) this.notifyLockState();
    return { unlocked, failed };
  }

  /**
   * Clears decrypted secrets from memory for the rest of the session, without
   * touching what is on disk.
   */
  lock(): void {
    let changed = false;
    for (const key of SECRET_KEYS) {
      const state = this.secrets[key];
      if (!state.ciphertext) continue;
      state.unlocked = false;
      state.known = undefined;
      this.settings[key] = "";
      changed = true;
    }
    if (changed) this.notifyLockState();
  }

  /**
   * Re-encrypts all currently unlocked secrets under `newPassword`.
   * `currentPassword` must match the existing secrets (verified via the
   * ciphertext, since no password hash is stored).
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    if (!newPassword) return false;
    const reference = this.anyCiphertext();
    if (reference && !(await verifyPassword(reference, currentPassword))) return false;
    // Everything must be unlocked, otherwise a still-encrypted secret would be
    // orphaned under the old password with no way to tell the user which.
    if (this.isLocked()) return false;

    for (const key of SECRET_KEYS) {
      const state = this.secrets[key];
      const plaintext = this.settings[key];
      if (!plaintext) {
        state.ciphertext = "";
        state.known = "";
        state.unlocked = true;
        continue;
      }
      state.ciphertext = await encryptSecret(plaintext, newPassword);
      state.known = plaintext;
      state.unlocked = true;
    }
    await this.save();
    return true;
  }

  /**
   * Forgotten-password escape hatch: discards every stored secret so the user
   * can set a new password by entering their API keys again. There is
   * deliberately no way to recover the old values.
   */
  async resetSecrets(): Promise<void> {
    for (const key of SECRET_KEYS) {
      this.secrets[key] = { ciphertext: "", known: "", unlocked: true };
      this.settings[key] = "";
    }
    await this.save();
  }

  /**
   * Decides what to persist for one secret, prompting for a password only when
   * the plaintext actually changed. Unrelated saves (sliders, TTS usage
   * counter, model dropdowns, ...) therefore never prompt - and, critically,
   * never overwrite a secret they didn't touch.
   */
  private async resolveCiphertext(key: SecretKey): Promise<string> {
    const state = this.secrets[key];
    const plaintext = this.settings[key];

    if (state.known === undefined) {
      // Locked. An empty field is just the locked placeholder - keep the stored
      // blob exactly as it is. A non-empty one means the user deliberately
      // typed a replacement without unlocking first, which must still work
      // (that is the escape hatch when only one of several secrets can be
      // unlocked), so fall through and re-encrypt it.
      if (!plaintext) return state.ciphertext;
    } else if (plaintext === state.known) {
      // Unchanged: reuse the existing ciphertext instead of re-encrypting
      // (which would also need the password again).
      return state.ciphertext;
    }
    // Cleared by the user: no password needed to delete something.
    if (!plaintext) {
      state.ciphertext = "";
      state.known = "";
      state.unlocked = true;
      return "";
    }

    const password = await this.requestPasswordFor(key);
    if (password === null) {
      // Cancelled: revert the edit so memory matches disk and nothing is lost.
      // A still-locked secret reverts to the empty placeholder, not to its
      // (unknown) stored plaintext.
      this.settings[key] = state.known ?? "";
      new Notice(
        `RAG Chat: ${SECRET_LABELS[key]} wurde nicht gespeichert (kein Passwort eingegeben).`,
        8000,
      );
      return state.ciphertext;
    }

    state.ciphertext = await encryptSecret(plaintext, password);
    state.known = plaintext;
    state.unlocked = true;
    return state.ciphertext;
  }

  /**
   * Asks for the password to encrypt `key` under. When another secret is
   * already stored, the entered password is verified against it, so both stay
   * under one password and a typo is caught immediately instead of silently
   * creating a secret nobody can unlock later.
   */
  private async requestPasswordFor(key: SecretKey): Promise<string | null> {
    const prompt = this.promptPassword;
    if (!prompt) {
      new Notice(
        `RAG Chat: ${SECRET_LABELS[key]} kann nicht gespeichert werden - keine Passwort-Eingabe verfügbar.`,
        8000,
      );
      return null;
    }
    const reference = this.anyCiphertext(key);
    const mode: PasswordPromptMode = reference ? "unlock" : "create";
    let error: string | undefined;

    // Re-prompt on a wrong password rather than failing the whole save.
    for (;;) {
      const password = await prompt({ mode, label: SECRET_LABELS[key], error });
      if (password === null) return null;
      if (!password) {
        error = "Bitte ein Passwort eingeben.";
        continue;
      }
      if (!reference) return password;
      if (await verifyPassword(reference, password)) return password;
      error = "Falsches Passwort - es muss zum bereits gespeicherten Schlüssel passen.";
    }
  }

  /** Any stored ciphertext, optionally excluding one key, for verification. */
  private anyCiphertext(exclude?: SecretKey): string {
    for (const key of SECRET_KEYS) {
      if (key === exclude) continue;
      if (this.secrets[key].ciphertext) return this.secrets[key].ciphertext;
    }
    return "";
  }

  private notifyLockState(): void {
    for (const listener of this.lockListeners) listener();
  }
}
