import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { resetObsidianMocks } from "../mocks/obsidian";
import { FakeFileSystemAdapter } from "../mocks/fake-app";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let getPluginDir: typeof import("../../plugin/paths").getPluginDir;
let getPluginDirFullPath: typeof import("../../plugin/paths").getPluginDirFullPath;

beforeEach(async () => {
  resetObsidianMocks();
  ({ getPluginDir, getPluginDirFullPath } = await import("../../plugin/paths"));
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
