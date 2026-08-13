import { createCipheriv, createDecipheriv, randomBytes, scrypt as scryptCb } from "node:crypto";
import * as os from "node:os";

const ENC_PREFIX = "enc:v1:";
const KEY_LEN = 32;
const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const;

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
