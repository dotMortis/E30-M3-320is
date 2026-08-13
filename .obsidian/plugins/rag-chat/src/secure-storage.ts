/**
 * secure-storage.ts — at-rest encryption for API keys persisted in data.json.
 *
 * Obsidian plugins run entirely in the Electron *renderer* process with no
 * main-process code and no IPC bridge, so Electron's `safeStorage` module
 * (main-process only, see Electron docs) is NOT reachable here. Instead we
 * derive an AES-256 key via scrypt from a machine fingerprint built purely
 * from `node:os` values (no subprocesses, no new dependencies) and use
 * AES-256-GCM for authenticated encryption.
 *
 * This is intentionally machine-bound: moving the vault to different
 * hardware will make decryption fail (by design) - see decryptSecret's
 * thrown error, which callers should catch and treat as "not set".
 *
 * Security note: the `os.*` fingerprint (hostname/platform/arch/cpu
 * model/total memory/homedir) is weaker than a true hardware UUID (e.g.
 * identical VM clones could collide) but matches the actual threat model
 * here - preventing the API key from sitting in plaintext in a file that
 * might get synced/backed up/committed by accident - without the
 * complexity/subprocess risk of shelling out to platform-specific machine-id
 * commands.
 *
 * This module is intentionally pure (no `obsidian` import) so it can be
 * exercised with a plain Node script outside of Obsidian.
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt as scryptCb } from "node:crypto";
import * as os from "node:os";

const ENC_PREFIX = "enc:v1:";
const KEY_LEN = 32; // AES-256
const SALT_LEN = 16;
const IV_LEN = 12; // recommended GCM IV length
const TAG_LEN = 16;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const;

// util.promisify doesn't reliably resolve crypto.scrypt's options-object
// overload (TS picks the callback-only signature), so wrap it manually.
function scrypt(password: string, salt: Buffer, keylen: number, options: typeof SCRYPT_PARAMS): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

function getMachineFingerprint(): string {
  return [
    os.hostname(),
    os.platform(),
    os.arch(),
    os.cpus()?.[0]?.model ?? "unknown-cpu",
    String(os.totalmem()),
    os.homedir(),
  ].join("|");
}

async function deriveKey(salt: Buffer): Promise<Buffer> {
  return await scrypt(getMachineFingerprint(), salt, KEY_LEN, SCRYPT_PARAMS);
}

/**
 * Encrypts `plain` for at-rest storage. Returns "" for an empty/unset input
 * (never encrypts an empty string) so DEFAULT_SETTINGS round-trips cleanly.
 */
export async function encryptSecret(plain: string): Promise<string> {
  if (!plain) return "";
  const salt = randomBytes(SALT_LEN);
  const key = await deriveKey(salt);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([salt, iv, tag, ciphertext]);
  return ENC_PREFIX + payload.toString("base64");
}

/**
 * Decrypts a value produced by encryptSecret. Throws on any failure
 * (unrecognized format, wrong machine fingerprint, corrupted/tampered data -
 * the GCM auth tag check catches the latter two). Callers should catch and
 * treat the secret as "not set" rather than propagating the error.
 */
export async function decryptSecret(stored: string | undefined): Promise<string> {
  if (!stored) return "";
  if (!stored.startsWith(ENC_PREFIX)) {
    throw new Error("unrecognized secret format");
  }
  const payload = Buffer.from(stored.slice(ENC_PREFIX.length), "base64");
  const salt = payload.subarray(0, SALT_LEN);
  const iv = payload.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const tag = payload.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + TAG_LEN);
  const ciphertext = payload.subarray(SALT_LEN + IV_LEN + TAG_LEN);
  const key = await deriveKey(salt);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plainBuf = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plainBuf.toString("utf8");
}
