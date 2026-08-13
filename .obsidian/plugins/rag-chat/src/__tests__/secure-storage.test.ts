import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "../secure-storage";

describe("encryptSecret", () => {
  it("returns an empty string for an empty input without encrypting", async () => {
    expect(await encryptSecret("")).toBe("");
  });

  it("produces a value prefixed with the versioned encryption marker", async () => {
    const encrypted = await encryptSecret("AIzaSyTestKey123");
    expect(encrypted.startsWith("enc:v1:")).toBe(true);
  });

  it("produces different ciphertext for the same plaintext on each call (random salt/iv)", async () => {
    const a = await encryptSecret("same-secret");
    const b = await encryptSecret("same-secret");
    expect(a).not.toBe(b);
  });
});

describe("decryptSecret", () => {
  it("returns an empty string for undefined input", async () => {
    expect(await decryptSecret(undefined)).toBe("");
  });

  it("returns an empty string for an empty string input", async () => {
    expect(await decryptSecret("")).toBe("");
  });

  it("round-trips a secret through encrypt then decrypt", async () => {
    const secret = "AIzaSyTestKey1234567890";
    const encrypted = await encryptSecret(secret);
    expect(await decryptSecret(encrypted)).toBe(secret);
  });

  it("round-trips a secret containing unicode characters", async () => {
    const secret = "Geheim-Schlüssel-äöü-🔑";
    const encrypted = await encryptSecret(secret);
    expect(await decryptSecret(encrypted)).toBe(secret);
  });

  it("throws on a value missing the versioned prefix", async () => {
    await expect(decryptSecret("not-a-real-encrypted-value")).rejects.toThrow("unrecognized secret format");
  });

  it("throws on tampered ciphertext (GCM auth tag check fails)", async () => {
    const encrypted = await encryptSecret("a-real-secret");
    const tampered = encrypted.slice(0, -4) + (encrypted.slice(-4) === "AAAA" ? "BBBB" : "AAAA");
    await expect(decryptSecret(tampered)).rejects.toThrow();
  });

  it("throws on a truncated payload", async () => {
    await expect(decryptSecret("enc:v1:dG9vc2hvcnQ=")).rejects.toThrow();
  });
});
