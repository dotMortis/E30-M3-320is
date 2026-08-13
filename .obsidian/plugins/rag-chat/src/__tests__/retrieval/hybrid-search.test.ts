import { describe, expect, it } from "vitest";
import { federatedHybridSearch } from "../../retrieval/hybrid-search";
import { buildFakeIndices, fakeRow, TEST_VECTOR_DIMS } from "../fixtures/build-indices";
import { fakeSettings } from "../fixtures/settings";

function unitVector(dim: number): number[] {
  return Array.from({ length: TEST_VECTOR_DIMS }, (_, i) => (i === dim ? 1 : 0));
}

describe("federatedHybridSearch", () => {
  it("returns an empty array when nothing matches on either leg", async () => {
    const indices = await buildFakeIndices([
      fakeRow({ rowId: "a", text: "Bremse wechseln", embedding: unitVector(0) }),
    ]);
    const hits = await federatedHybridSearch(indices, "Kraftstoffdruck", unitVector(2), fakeSettings());
    expect(hits).toEqual([]);
  });

  it("returns a BM25-only match when the vector leg has no similar candidate", async () => {
    const indices = await buildFakeIndices([
      fakeRow({ rowId: "a", text: "Kraftstoffdruck prüfen am Verteilerrohr", embedding: unitVector(0) }),
    ]);
    const hits = await federatedHybridSearch(indices, "Kraftstoffdruck", unitVector(3), fakeSettings());
    expect(hits.map((h) => h.rowId)).toContain("a");
  });

  it("returns a vector-only match when the text leg has no term overlap", async () => {
    const indices = await buildFakeIndices([
      fakeRow({ rowId: "a", text: "völlig unrelated content", embedding: unitVector(1) }),
    ]);
    const hits = await federatedHybridSearch(indices, "xyz-no-match", unitVector(1), fakeSettings({ similarity: 0.9 }));
    expect(hits.map((h) => h.rowId)).toContain("a");
  });

  it("respects the similarity threshold to exclude a dissimilar vector candidate", async () => {
    const indices = await buildFakeIndices([
      fakeRow({ rowId: "a", text: "unrelated", embedding: unitVector(1) }),
    ]);
    const hits = await federatedHybridSearch(indices, "no-text-match", unitVector(2), fakeSettings({ similarity: 0.9 }));
    expect(hits).toEqual([]);
  });

  it("merges hits from multiple vector shards", async () => {
    const indices = await buildFakeIndices(
      [
        fakeRow({ rowId: "shard0-hit", text: "x", embedding: unitVector(0), shard: 0 }),
        fakeRow({ rowId: "shard1-hit", text: "x", embedding: unitVector(0), shard: 1 }),
      ],
      { shardCount: 2 }
    );
    const hits = await federatedHybridSearch(indices, "no-match", unitVector(0), fakeSettings({ similarity: 0.5 }));
    const rowIds = hits.map((h) => h.rowId);
    expect(rowIds).toContain("shard0-hit");
    expect(rowIds).toContain("shard1-hit");
  });

  it("respects settings.topK when slicing the merged results", async () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      fakeRow({ rowId: `row-${i}`, text: "Bremse Bremse Bremse", embedding: unitVector(0) })
    );
    const indices = await buildFakeIndices(rows);
    const hits = await federatedHybridSearch(indices, "Bremse", unitVector(0), fakeSettings({ topK: 2 }));
    expect(hits).toHaveLength(2);
  });

  it("maps each returned hit to the RetrievedHit shape with score/rowId/notePath/seitencode/sektion/titel/kind", async () => {
    const indices = await buildFakeIndices([
      fakeRow({
        rowId: "a",
        text: "Bremse wechseln",
        embedding: unitVector(0),
        seitencode: "34-01",
        sektion: "Bremsen",
        titel: "Bremse wechseln",
        notePath: "34-01.md",
        kind: "multimodal",
      }),
    ]);
    const hits = await federatedHybridSearch(indices, "Bremse", unitVector(0), fakeSettings());
    expect(hits[0]).toMatchObject({
      rowId: "a",
      notePath: "34-01.md",
      seitencode: "34-01",
      sektion: "Bremsen",
      titel: "Bremse wechseln",
      kind: "multimodal",
    });
    expect(typeof hits[0].score).toBe("number");
  });

  it("ranks a document matching on both legs above one matching on only one leg", async () => {
    const indices = await buildFakeIndices([
      fakeRow({ rowId: "both-legs", text: "Kraftstoffdruck prüfen", embedding: unitVector(0) }),
      fakeRow({ rowId: "text-only", text: "Kraftstoffdruck Filter", embedding: unitVector(2) }),
    ]);
    const hits = await federatedHybridSearch(indices, "Kraftstoffdruck", unitVector(0), fakeSettings({ similarity: 0.5 }));
    const bothIndex = hits.findIndex((h) => h.rowId === "both-legs");
    const textOnlyIndex = hits.findIndex((h) => h.rowId === "text-only");
    expect(bothIndex).toBeLessThan(textOnlyIndex);
  });
});
