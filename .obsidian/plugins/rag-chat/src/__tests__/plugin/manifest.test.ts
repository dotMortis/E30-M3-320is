import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { resetObsidianMocks } from "../mocks/obsidian";
import { FakeFileSystemAdapter } from "../mocks/fake-app";
import { fakeManifest } from "../fixtures/manifest";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let getPluginDir: typeof import("../../plugin/manifest").getPluginDir;
let getPluginDirFullPath: typeof import("../../plugin/manifest").getPluginDirFullPath;
let readManifest: typeof import("../../plugin/manifest").readManifest;

beforeEach(async () => {
  resetObsidianMocks();
  ({ getPluginDir, getPluginDirFullPath, readManifest } = await import("../../plugin/manifest"));
});

describe("getPluginDir", () => {
  it("returns manifest.dir when set by Obsidian at runtime", () => {
    expect(getPluginDir({ dir: ".obsidian/plugins/rag-chat", id: "rag-chat" })).toBe(".obsidian/plugins/rag-chat");
  });

  it("falls back to the conventional path when manifest.dir is unset", () => {
    expect(getPluginDir({ id: "rag-chat" })).toBe(".obsidian/plugins/rag-chat");
  });
});

describe("getPluginDirFullPath", () => {
  it("resolves the vault-relative dir to a real filesystem path via FileSystemAdapter", () => {
    const adapter = new FakeFileSystemAdapter({}, "/home/user/vault");
    const vault = { adapter } as unknown as Vault;
    const result = getPluginDirFullPath(vault, { dir: ".obsidian/plugins/rag-chat", id: "rag-chat" });
    expect(result).toBe("/home/user/vault/.obsidian/plugins/rag-chat");
  });

  it("falls back to the vault-relative path when the adapter is not a FileSystemAdapter (e.g. mobile)", () => {
    const vault = { adapter: {} } as unknown as Vault;
    const result = getPluginDirFullPath(vault, { dir: ".obsidian/plugins/rag-chat", id: "rag-chat" });
    expect(result).toBe(".obsidian/plugins/rag-chat");
  });
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
