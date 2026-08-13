import { describe, expect, it } from "vitest";
import type { Vault } from "obsidian";
import { expandToParentNotes } from "../../retrieval/parent-notes";
import { createFakeVault } from "../mocks/fake-vault";
import { fakeHit } from "../fixtures/retrieved-hits";
import type { ReferenceChunkMap } from "../../retrieval/types";

describe("expandToParentNotes", () => {
  it("returns an empty array for an empty hit list", async () => {
    const vault = createFakeVault([]);
    const result = await expandToParentNotes([], vault as unknown as Vault, new Map());
    expect(result).toEqual([]);
  });

  it("reads the full note text for a page-note ('text' kind) hit", async () => {
    const vault = createFakeVault([{ notePath: "16-01.md", content: "# Tank ausbauen\n\nSchritt 1..." }]);
    const hits = [fakeHit({ rowId: "row-1", notePath: "16-01.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank ausbauen", kind: "text" })];
    const result = await expandToParentNotes(hits, vault as unknown as Vault, new Map());
    expect(result).toEqual([
      { notePath: "16-01.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank ausbauen", fullText: "# Tank ausbauen\n\nSchritt 1..." },
    ]);
  });

  it("reads the full note text for a 'multimodal' kind hit the same way as 'text'", async () => {
    const vault = createFakeVault([{ notePath: "16-02.md", content: "Foto-Seite Inhalt" }]);
    const hits = [fakeHit({ rowId: "row-2", notePath: "16-02.md", kind: "multimodal" })];
    const result = await expandToParentNotes(hits, vault as unknown as Vault, new Map());
    expect(result[0].fullText).toBe("Foto-Seite Inhalt");
  });

  it("dedupes page-note hits by notePath, keeping only the first (highest-ranked) one", async () => {
    const vault = createFakeVault([{ notePath: "16-01.md", content: "Inhalt" }]);
    const hits = [
      fakeHit({ rowId: "row-1", notePath: "16-01.md", titel: "Best rank" }),
      fakeHit({ rowId: "row-1-dup", notePath: "16-01.md", titel: "Worse rank" }),
    ];
    const result = await expandToParentNotes(hits, vault as unknown as Vault, new Map());
    expect(result).toHaveLength(1);
    expect(result[0].titel).toBe("Best rank");
  });

  it("skips a hit whose note no longer exists in the vault", async () => {
    const vault = createFakeVault([]);
    const hits = [fakeHit({ rowId: "row-1", notePath: "moved-or-deleted.md" })];
    const result = await expandToParentNotes(hits, vault as unknown as Vault, new Map());
    expect(result).toEqual([]);
  });

  it("looks up 'reference' kind hits in the reference-chunks sidecar instead of reading a full file", async () => {
    const vault = createFakeVault([]);
    const referenceChunks: ReferenceChunkMap = new Map([
      ["ref-row-1", { text: "Spezialwerkzeug 11 1 210", titel: "Sonderwerkzeuge", notePath: "Referenz/Sonderwerkzeuge.md" }],
    ]);
    const hits = [
      fakeHit({ rowId: "ref-row-1", notePath: "Referenz/Sonderwerkzeuge.md", sektion: "Referenz", titel: "Sonderwerkzeuge", kind: "reference" }),
    ];
    const result = await expandToParentNotes(hits, vault as unknown as Vault, referenceChunks);
    expect(result).toEqual([
      { notePath: "Referenz/Sonderwerkzeuge.md", seitencode: "", sektion: "Referenz", titel: "Sonderwerkzeuge", fullText: "Spezialwerkzeug 11 1 210" },
    ]);
  });

  it("dedupes reference hits by rowId rather than notePath, keeping distinct chunks from the same doc", async () => {
    const vault = createFakeVault([]);
    const referenceChunks: ReferenceChunkMap = new Map([
      ["ref-1", { text: "Werkzeuggruppe A", titel: "Sonderwerkzeuge", notePath: "Referenz/Sonderwerkzeuge.md" }],
      ["ref-2", { text: "Werkzeuggruppe B", titel: "Sonderwerkzeuge", notePath: "Referenz/Sonderwerkzeuge.md" }],
    ]);
    const hits = [
      fakeHit({ rowId: "ref-1", notePath: "Referenz/Sonderwerkzeuge.md", kind: "reference" }),
      fakeHit({ rowId: "ref-2", notePath: "Referenz/Sonderwerkzeuge.md", kind: "reference" }),
    ];
    const result = await expandToParentNotes(hits, vault as unknown as Vault, referenceChunks);
    expect(result).toHaveLength(2);
    expect(result.map((b) => b.fullText)).toEqual(["Werkzeuggruppe A", "Werkzeuggruppe B"]);
  });

  it("skips a reference hit missing from the sidecar (stale index/sidecar mismatch)", async () => {
    const vault = createFakeVault([]);
    const hits = [fakeHit({ rowId: "missing-ref", notePath: "Referenz/Sonderwerkzeuge.md", kind: "reference" })];
    const result = await expandToParentNotes(hits, vault as unknown as Vault, new Map());
    expect(result).toEqual([]);
  });

  it("always sets seitencode to an empty string for reference blocks regardless of the hit's own value", async () => {
    const vault = createFakeVault([]);
    const referenceChunks: ReferenceChunkMap = new Map([
      ["ref-1", { text: "text", titel: "Titel", notePath: "Referenz/Glossar.md" }],
    ]);
    const hits = [fakeHit({ rowId: "ref-1", notePath: "Referenz/Glossar.md", seitencode: "should-be-ignored", kind: "reference" })];
    const result = await expandToParentNotes(hits, vault as unknown as Vault, referenceChunks);
    expect(result[0].seitencode).toBe("");
  });

  it("processes a mix of page-note and reference hits, preserving relative order", async () => {
    const vault = createFakeVault([{ notePath: "16-01.md", content: "Tank Inhalt" }]);
    const referenceChunks: ReferenceChunkMap = new Map([
      ["ref-1", { text: "Werkzeug Inhalt", titel: "Sonderwerkzeuge", notePath: "Referenz/Sonderwerkzeuge.md" }],
    ]);
    const hits = [
      fakeHit({ rowId: "row-1", notePath: "16-01.md", kind: "text" }),
      fakeHit({ rowId: "ref-1", notePath: "Referenz/Sonderwerkzeuge.md", kind: "reference" }),
    ];
    const result = await expandToParentNotes(hits, vault as unknown as Vault, referenceChunks);
    expect(result.map((b) => b.notePath)).toEqual(["16-01.md", "Referenz/Sonderwerkzeuge.md"]);
  });
});
