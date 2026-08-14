import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeManifest } from "../fixtures/manifest";

const loadTextIndex = vi.fn();
const loadVectorShard = vi.fn();
vi.mock("../../retrieval/orama-schema", () => ({ loadTextIndex, loadVectorShard }));

const readFileSync = vi.fn();
vi.mock("node:fs", () => ({ readFileSync }));

let getIndices: typeof import("../../retrieval/index-cache").getIndices;
let clearIndicesCache: typeof import("../../retrieval/index-cache").clearIndicesCache;

const REFERENCE_CHUNKS_JSON = JSON.stringify({
  "row-1": { text: "Sonderwerkzeug-Text", titel: "Sonderwerkzeuge", notePath: "Referenz/Sonderwerkzeuge.md" },
});

beforeEach(async () => {
  vi.resetModules();
  loadTextIndex.mockReset();
  loadVectorShard.mockReset();
  readFileSync.mockReset();
  loadTextIndex.mockResolvedValue({ marker: "textDb" });
  loadVectorShard.mockImplementation(async (path: string) => ({ marker: "vectorDb", path }));
  readFileSync.mockReturnValue(REFERENCE_CHUNKS_JSON);
  ({ getIndices, clearIndicesCache } = await import("../../retrieval/index-cache"));
});

describe("getIndices", () => {
  it("loads the text index at pluginDir/manifest.textIndexFile", async () => {
    await getIndices("/plugin/dir", fakeManifest());
    expect(loadTextIndex).toHaveBeenCalledWith("/plugin/dir/rag-index-text.orama.msp");
  });

  it("loads one vector shard per manifest.vectorShardCount, expanding the {i} placeholder", async () => {
    await getIndices("/plugin/dir", fakeManifest({ vectorShardCount: 3 }));
    expect(loadVectorShard).toHaveBeenCalledTimes(3);
    expect(loadVectorShard).toHaveBeenCalledWith("/plugin/dir/rag-index-vectors-0.orama.msp");
    expect(loadVectorShard).toHaveBeenCalledWith("/plugin/dir/rag-index-vectors-1.orama.msp");
    expect(loadVectorShard).toHaveBeenCalledWith("/plugin/dir/rag-index-vectors-2.orama.msp");
  });

  it("reads and parses the reference-chunks.json sidecar into a Map", async () => {
    const result = await getIndices("/plugin/dir", fakeManifest());
    expect(readFileSync).toHaveBeenCalledWith("/plugin/dir/reference-chunks.json", "utf-8");
    expect(result.referenceChunks.get("row-1")).toEqual({
      text: "Sonderwerkzeug-Text",
      titel: "Sonderwerkzeuge",
      notePath: "Referenz/Sonderwerkzeuge.md",
    });
  });

  it("returns the loaded text/vector dbs in the CachedIndices shape", async () => {
    const result = await getIndices("/plugin/dir", fakeManifest({ vectorShardCount: 1 }));
    expect(result.textDb).toEqual({ marker: "textDb" });
    expect(result.vectorDbs).toHaveLength(1);
  });

  it("caches the result: a second call with the same pluginDir does not reload from disk", async () => {
    await getIndices("/plugin/dir", fakeManifest());
    await getIndices("/plugin/dir", fakeManifest());
    expect(loadTextIndex).toHaveBeenCalledTimes(1);
    expect(readFileSync).toHaveBeenCalledTimes(1);
  });

  it("reloads when called with a different pluginDir", async () => {
    await getIndices("/plugin/dir-a", fakeManifest());
    await getIndices("/plugin/dir-b", fakeManifest());
    expect(loadTextIndex).toHaveBeenCalledTimes(2);
    expect(loadTextIndex).toHaveBeenLastCalledWith("/plugin/dir-b/rag-index-text.orama.msp");
  });

  it("returns the same cached object reference on repeated calls", async () => {
    const first = await getIndices("/plugin/dir", fakeManifest());
    const second = await getIndices("/plugin/dir", fakeManifest());
    expect(second).toBe(first);
  });

  it("reloads when the manifest's corpusHash changes, even for the same pluginDir", async () => {
    await getIndices("/plugin/dir", fakeManifest({ corpusHash: "hash-a" }));
    await getIndices("/plugin/dir", fakeManifest({ corpusHash: "hash-b" }));
    expect(loadTextIndex).toHaveBeenCalledTimes(2);
  });

  it("does not reload when corpusHash and pluginDir are both unchanged", async () => {
    await getIndices("/plugin/dir", fakeManifest({ corpusHash: "hash-a" }));
    await getIndices("/plugin/dir", fakeManifest({ corpusHash: "hash-a" }));
    expect(loadTextIndex).toHaveBeenCalledTimes(1);
  });

  it("caches the in-flight promise: concurrent calls before the first resolves only load once", async () => {
    let resolveLoad!: () => void;
    loadTextIndex.mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = () => resolve({ marker: "textDb" });
      })
    );
    const first = getIndices("/plugin/dir", fakeManifest());
    const second = getIndices("/plugin/dir", fakeManifest());
    resolveLoad();
    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(loadTextIndex).toHaveBeenCalledTimes(1);
    expect(secondResult).toBe(firstResult);
  });

  it("does not cache a failed load, allowing the next call to retry", async () => {
    loadTextIndex.mockRejectedValueOnce(new Error("disk error"));
    await expect(getIndices("/plugin/dir", fakeManifest())).rejects.toThrow("disk error");

    loadTextIndex.mockResolvedValueOnce({ marker: "textDb" });
    const result = await getIndices("/plugin/dir", fakeManifest());
    expect(result.textDb).toEqual({ marker: "textDb" });
  });

  describe("clearIndicesCache", () => {
    it("forces the next getIndices call to reload from disk even with an unchanged key", async () => {
      await getIndices("/plugin/dir", fakeManifest());
      clearIndicesCache();
      await getIndices("/plugin/dir", fakeManifest());
      expect(loadTextIndex).toHaveBeenCalledTimes(2);
    });
  });
});
