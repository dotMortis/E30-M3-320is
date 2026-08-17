import { describe, expect, it, vi } from "vitest";
import {
  decryptSecret,
  encryptSecret,
  isEncryptedSecret,
  isLegacySecret,
  LEGACY_SECRET_ERROR,
  verifyPassword,
} from "../secure-storage";

const PASSWORD = "correct horse battery staple";

describe("encryptSecret", () => {
  it("returns an empty string for an empty input without encrypting", async () => {
    expect(await encryptSecret("", PASSWORD)).toBe("");
  });

  it("produces a value prefixed with the versioned encryption marker", async () => {
    const encrypted = await encryptSecret("AIzaSyTestKey123", PASSWORD);
    expect(encrypted.startsWith("enc:v2:")).toBe(true);
  });

  it("produces different ciphertext for the same plaintext on each call (random salt/iv)", async () => {
    const a = await encryptSecret("same-secret", PASSWORD);
    const b = await encryptSecret("same-secret", PASSWORD);
    expect(a).not.toBe(b);
  });

  it("refuses to encrypt without a password", async () => {
    await expect(encryptSecret("a-secret", "")).rejects.toThrow("cannot encrypt without a password");
  });
});

describe("decryptSecret", () => {
  it("returns an empty string for undefined input", async () => {
    expect(await decryptSecret(undefined, PASSWORD)).toBe("");
  });

  it("returns an empty string for an empty string input", async () => {
    expect(await decryptSecret("", PASSWORD)).toBe("");
  });

  it("round-trips a secret through encrypt then decrypt with the same password", async () => {
    const secret = "AIzaSyTestKey1234567890";
    const encrypted = await encryptSecret(secret, PASSWORD);
    expect(await decryptSecret(encrypted, PASSWORD)).toBe(secret);
  });

  it("round-trips a secret containing unicode characters", async () => {
    const secret = "Geheim-Schlüssel-äöü-🔑";
    const encrypted = await encryptSecret(secret, PASSWORD);
    expect(await decryptSecret(encrypted, PASSWORD)).toBe(secret);
  });

  it("round-trips a password containing unicode characters", async () => {
    const password = "Paßwort-äöü-🔐";
    const encrypted = await encryptSecret("a-secret", password);
    expect(await decryptSecret(encrypted, password)).toBe("a-secret");
  });

  it("throws on the wrong password (GCM auth tag check fails)", async () => {
    const encrypted = await encryptSecret("a-secret", PASSWORD);
    await expect(decryptSecret(encrypted, "wrong-password")).rejects.toThrow();
  });

  it("throws on an empty password when a real one was used", async () => {
    const encrypted = await encryptSecret("a-secret", PASSWORD);
    await expect(decryptSecret(encrypted, "")).rejects.toThrow();
  });

  it("throws a distinct legacy error for enc:v1: values, whatever the password", async () => {
    await expect(decryptSecret("enc:v1:AAAABBBBCCCC", PASSWORD)).rejects.toThrow(LEGACY_SECRET_ERROR);
  });

  it("throws on a value missing the versioned prefix", async () => {
    await expect(decryptSecret("not-a-real-encrypted-value", PASSWORD)).rejects.toThrow(
      "unrecognized secret format",
    );
  });

  it("throws on tampered ciphertext (GCM auth tag check fails)", async () => {
    const encrypted = await encryptSecret("a-real-secret", PASSWORD);
    const tampered = encrypted.slice(0, -4) + (encrypted.slice(-4) === "AAAA" ? "BBBB" : "AAAA");
    await expect(decryptSecret(tampered, PASSWORD)).rejects.toThrow();
  });

  it("throws on a truncated payload", async () => {
    await expect(decryptSecret("enc:v2:dG9vc2hvcnQ=", PASSWORD)).rejects.toThrow();
  });

  /**
   * The whole point of the password scheme: the key must not depend on
   * anything the machine reports, so nothing about the host can invalidate a
   * stored secret. The v1 scheme derived it from a fingerprint that included
   * os.totalmem() - re-probed on every boot and not guaranteed stable across
   * reboots - which silently locked users out of their own keys.
   *
   * Any machine value would have to come from node:os, so this stubs the whole
   * module with throwing accessors: if a future change reintroduces one, the
   * round-trip below fails instead of quietly regressing.
   */
  it("does not derive the key from any machine value (node:os is never consulted)", async () => {
    vi.resetModules();
    vi.doMock("node:os", () => {
      const fail = (): never => {
        throw new Error("secure-storage must not depend on machine values");
      };
      return {
        default: {},
        hostname: fail,
        platform: fail,
        arch: fail,
        cpus: fail,
        totalmem: fail,
        homedir: fail,
      };
    });
    try {
      const fresh = await import("../secure-storage");
      const encrypted = await fresh.encryptSecret("survives-reboot", PASSWORD);
      expect(await fresh.decryptSecret(encrypted, PASSWORD)).toBe("survives-reboot");
    } finally {
      vi.doUnmock("node:os");
      vi.resetModules();
    }
  });
});

describe("verifyPassword", () => {
  it("returns true for the password the secret was encrypted with", async () => {
    const encrypted = await encryptSecret("a-secret", PASSWORD);
    expect(await verifyPassword(encrypted, PASSWORD)).toBe(true);
  });

  it("returns false (without throwing) for a wrong password", async () => {
    const encrypted = await encryptSecret("a-secret", PASSWORD);
    expect(await verifyPassword(encrypted, "nope")).toBe(false);
  });

  it("returns false for values that aren't encrypted secrets", async () => {
    expect(await verifyPassword("", PASSWORD)).toBe(false);
    expect(await verifyPassword(undefined, PASSWORD)).toBe(false);
    expect(await verifyPassword("plaintext-key", PASSWORD)).toBe(false);
    expect(await verifyPassword("enc:v1:AAAA", PASSWORD)).toBe(false);
  });
});

describe("format detection", () => {
  it("recognises current and legacy prefixes", async () => {
    const encrypted = await encryptSecret("a-secret", PASSWORD);
    expect(isEncryptedSecret(encrypted)).toBe(true);
    expect(isLegacySecret(encrypted)).toBe(false);

    expect(isLegacySecret("enc:v1:AAAA")).toBe(true);
    expect(isEncryptedSecret("enc:v1:AAAA")).toBe(false);

    expect(isEncryptedSecret("AIzaPlaintext")).toBe(false);
    expect(isLegacySecret("AIzaPlaintext")).toBe(false);
    expect(isEncryptedSecret(undefined)).toBe(false);
    expect(isLegacySecret(undefined)).toBe(false);
  });
});
