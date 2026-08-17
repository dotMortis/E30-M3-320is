import { createCipheriv, createDecipheriv, randomBytes, scrypt as scryptCb } from "node:crypto";

/**
 * Current format: secrets are encrypted with a key derived from a *user-supplied
 * password*, so they survive reboots, hardware changes and vault syncs.
 */
const ENC_PREFIX = "enc:v2:";
/**
 * Legacy format (v1) derived its key from a machine fingerprint that included
 * `os.totalmem()`. That value is re-probed from the OS on every process start
 * and is not guaranteed to be byte-identical across reboots (firmware/iGPU
 * memory reservations, memory training, fast-startup accounting), so a reboot
 * could silently make the key underivable and lock the user out of their own
 * secrets. v1 blobs are unrecoverable here (we have no password for them and
 * the fingerprint may already have changed) - we only recognise the prefix so
 * callers can show a precise "please re-enter" message instead of a misleading
 * "wrong password".
 */
const LEGACY_ENC_PREFIX = "enc:v1:";
const KEY_LEN = 32;
const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const;

/** Thrown for `enc:v1:` values, which no password can recover. */
export const LEGACY_SECRET_ERROR = "legacy-secret-format";

function scrypt(password: string, salt: Buffer, keylen: number, options: typeof SCRYPT_PARAMS): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return await scrypt(password, salt, KEY_LEN, SCRYPT_PARAMS);
}

/** True for values this module wrote (i.e. not plaintext, not legacy). */
export function isEncryptedSecret(value: string | undefined): boolean {
  return typeof value === "string" && value.startsWith(ENC_PREFIX);
}

/** True for values written by the pre-password machine-fingerprint scheme. */
export function isLegacySecret(value: string | undefined): boolean {
  return typeof value === "string" && value.startsWith(LEGACY_ENC_PREFIX);
}

export async function encryptSecret(plain: string, password: string): Promise<string> {
  if (!plain) return "";
  if (!password) throw new Error("cannot encrypt without a password");
  const salt = randomBytes(SALT_LEN);
  const key = await deriveKey(password, salt);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([salt, iv, tag, ciphertext]);
  return ENC_PREFIX + payload.toString("base64");
}

/**
 * Decrypts a stored secret. Throws when `password` is wrong (the GCM auth tag
 * check fails), which is also how callers verify a password: there is
 * deliberately no password hash stored anywhere.
 */
export async function decryptSecret(stored: string | undefined, password: string): Promise<string> {
  if (!stored) return "";
  if (isLegacySecret(stored)) {
    throw new Error(LEGACY_SECRET_ERROR);
  }
  if (!stored.startsWith(ENC_PREFIX)) {
    throw new Error("unrecognized secret format");
  }
  const payload = Buffer.from(stored.slice(ENC_PREFIX.length), "base64");
  const salt = payload.subarray(0, SALT_LEN);
  const iv = payload.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const tag = payload.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + TAG_LEN);
  const ciphertext = payload.subarray(SALT_LEN + IV_LEN + TAG_LEN);
  const key = await deriveKey(password, salt);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plainBuf = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plainBuf.toString("utf8");
}

/** Whether `password` can decrypt `stored`. Never throws. */
export async function verifyPassword(stored: string | undefined, password: string): Promise<boolean> {
  if (!isEncryptedSecret(stored)) return false;
  try {
    await decryptSecret(stored, password);
    return true;
  } catch {
    return false;
  }
}
