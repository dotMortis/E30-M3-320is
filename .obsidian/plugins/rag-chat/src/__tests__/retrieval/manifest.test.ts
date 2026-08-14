import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { resetObsidianMocks } from "../mocks/obsidian";
import { FakeFileSystemAdapter } from "../mocks/fake-app";
import { fakeManifest } from "../fixtures/manifest";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let readManifest: typeof import("../../retrieval/manifest").readManifest;

beforeEach(async () => {
  resetObsidianMocks();
  ({ readManifest } = await import("../../retrieval/manifest"));
});

describe("readManifest", () => {
  it("reads and parses rag-manifest.json from pluginDir via the vault adapter", async () => {
    const manifest = fakeManifest();
    const adapter = new FakeFileSystemAdapter({ "/plugin/dir/rag-manifest.json": JSON.stringify(manifest) });
    const vault = { adapter } as unknown as Vault;
    const result = await readManifest(vault, "/plugin/dir");
    expect(result).toEqual(manifest);
  });

  it("propagates a read failure (e.g. missing file) to the caller", async () => {
    const adapter = new FakeFileSystemAdapter({});
    const vault = { adapter } as unknown as Vault;
    await expect(readManifest(vault, "/plugin/dir")).rejects.toThrow();
  });
});
