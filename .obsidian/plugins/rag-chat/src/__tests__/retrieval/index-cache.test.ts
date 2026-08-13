import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeManifest } from "../fixtures/manifest";

const loadTextIndex = vi.fn();
const loadVectorShard = vi.fn();
vi.mock("../../retrieval/orama-schema", () => ({ loadTextIndex, loadVectorShard }));

const readFileSync = vi.fn();
vi.mock("node:fs", () => ({ readFileSync }));

let getIndices: typeof import("../../retrieval/index-cache").getIndices;

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
  ({ getIndices } = await import("../../retrieval/index-cache"));
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
});
