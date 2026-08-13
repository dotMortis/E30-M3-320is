import { create, insert } from "@orama/orama";
import { beforeEach, describe, expect, it, vi } from "vitest";

const restoreFromFile = vi.fn();
vi.mock("@orama/plugin-data-persistence/server", () => ({ restoreFromFile }));

let loadTextIndex: typeof import("../../retrieval/orama-schema").loadTextIndex;
let loadVectorShard: typeof import("../../retrieval/orama-schema").loadVectorShard;
let TEXT_SCHEMA: typeof import("../../retrieval/orama-schema").TEXT_SCHEMA;

beforeEach(async () => {
  restoreFromFile.mockReset();
  ({ loadTextIndex, loadVectorShard, TEXT_SCHEMA } = await import("../../retrieval/orama-schema"));
});

async function buildPlaceholderTextDb() {
  const db = await create({ schema: TEXT_SCHEMA });
  await insert(db, {
    rowId: "a",
    seitencode: "16-01",
    sektionNr: "16",
    sektion: "Hinterachse",
    titel: "Hinterachse ausbauen",
    tags: [],
    notePath: "16-01.md",
    bilddatei: "",
    kind: "text",
    text: "Hinterachse Reparatur",
  });
  await insert(db, {
    rowId: "b",
    seitencode: "34-01",
    sektionNr: "34",
    sektion: "Bremsen",
    titel: "Bremse wechseln",
    tags: [],
    notePath: "34-01.md",
    bilddatei: "",
    kind: "text",
    text: "Bremse vorne wechseln",
  });
  return db;
}

describe("loadTextIndex", () => {
  it("calls restoreFromFile with binary/node mode against the given path", async () => {
    restoreFromFile.mockResolvedValue(await buildPlaceholderTextDb());
    await loadTextIndex("/plugin/dir/rag-index-text.orama.msp");
    expect(restoreFromFile).toHaveBeenCalledWith("binary", "/plugin/dir/rag-index-text.orama.msp", "node");
  });

  it("preserves all restored documents in the rebuilt index", async () => {
    const { search } = await import("@orama/orama");
    restoreFromFile.mockResolvedValue(await buildPlaceholderTextDb());
    const db = await loadTextIndex("/plugin/dir/rag-index-text.orama.msp");
    const result = await search(db, { term: "Bremse", mode: "fulltext" });
    expect(result.hits.map((h) => h.document.rowId)).toContain("b");
  });

  it("fixes the German-tokenizer bug: 'hinter' no longer prefix-matches 'Hinterachse'", async () => {
    const { search } = await import("@orama/orama");
    restoreFromFile.mockResolvedValue(await buildPlaceholderTextDb());
    const db = await loadTextIndex("/plugin/dir/rag-index-text.orama.msp");
    const result = await search(db, { term: "hinter", mode: "fulltext" });
    expect(result.hits.map((h) => h.document.rowId)).not.toContain("a");
  });

  it("reproduces the bug on a bare restore with the default tokenizer (sanity check for the test itself)", async () => {
    const { search } = await import("@orama/orama");
    const placeholder = await buildPlaceholderTextDb();
    const result = await search(placeholder, { term: "hinter", mode: "fulltext" });
    expect(result.hits.map((h) => h.document.rowId)).toContain("a");
  });
});

describe("loadVectorShard", () => {
  it("returns the restored db unchanged (no tokenizer fix-up needed for vector-only shards)", async () => {
    const placeholder = { marker: "vector-shard" };
    restoreFromFile.mockResolvedValue(placeholder);
    const db = await loadVectorShard("/plugin/dir/rag-index-vectors-0.orama.msp");
    expect(db).toBe(placeholder);
    expect(restoreFromFile).toHaveBeenCalledWith("binary", "/plugin/dir/rag-index-vectors-0.orama.msp", "node");
  });
});
