import { describe, it, expect, vi, beforeAll } from "vitest";
import { createFakeApp } from "../mocks/fakeVault.js";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian.js");
  return mock;
});

let SearchEngine;
beforeAll(async () => {
  ({ SearchEngine } = await import("../../main.js"));
});

const NOTE = {
  rowId: "01-test/schlauch.md",
  notePath: "01-test/schlauch.md",
  code: "01-001",
  titel: "Schlauchverbindung pruefen",
  titleEn: "",
  section: "Test",
  tags: [],
  content: "Den kraftstoffschlauch auf Risse pruefen. Ein rohrleitungsstueck ist ebenfalls zu kontrollieren.",
};

describe("SearchEngine._build() with lazy-loaded data files", () => {
  it("loads synonyms.json/compound-parts.json at runtime and wires them into search", async () => {
    const app = createFakeApp([NOTE], {
      dataFiles: {
        "data/synonyms.json": [["schlauch", "rohr"]],
        "data/compound-parts.json": { kraftstoffschlauch: ["kraftstoff", "schlauch"] },
      },
    });
    const engine = new SearchEngine(app, ".obsidian/plugins/vault-search");
    await engine.ensureBuilt();

    expect(engine.ready).toBe(true);
    expect(engine.synonymMap.get("schlauch")).toEqual(new Set(["rohr"]));
    expect(engine.compoundParts).toEqual({ kraftstoffschlauch: ["kraftstoff", "schlauch"] });

    const { results, expandedTerms } = await engine.search("rohr", 10);
    expect(expandedTerms).toContain("schlauch");
    expect(results.map((r) => r.notePath)).toContain(NOTE.notePath);
  });

  it("indexes every file correctly even when reads complete out of order (bounded concurrency)", async () => {
    const notes = [
      { ...NOTE, rowId: "a.md", notePath: "a.md", titel: "Alpha Artikel", content: "Inhalt ueber alpha und nichts anderes." },
      { ...NOTE, rowId: "b.md", notePath: "b.md", titel: "Beta Artikel", content: "Inhalt ueber beta und nichts anderes." },
      { ...NOTE, rowId: "c.md", notePath: "c.md", titel: "Gamma Artikel", content: "Inhalt ueber gamma und nichts anderes." },
      { ...NOTE, rowId: "d.md", notePath: "d.md", titel: "Delta Artikel", content: "Inhalt ueber delta und nichts anderes." },
    ];
    const app = createFakeApp(notes, {
      dataFiles: { "data/synonyms.json": [], "data/compound-parts.json": {} },
      readDelayByPath: { "a.md": 30, "b.md": 20, "c.md": 10, "d.md": 0 },
    });
    const engine = new SearchEngine(app, ".obsidian/plugins/vault-search");
    await engine.ensureBuilt();

    for (const note of notes) {
      const { results } = await engine.search(note.titel, 10);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].notePath).toBe(note.notePath);
      expect(engine.contentByRowId.get(note.rowId)).toBe(note.content);
    }
  });

  it("falls back to empty synonyms/compound-parts (not a crash) when the data files are unreadable", async () => {
    const app = createFakeApp([NOTE], { dataReadShouldFail: true });
    const engine = new SearchEngine(app, ".obsidian/plugins/vault-search");
    await expect(engine.ensureBuilt()).resolves.not.toThrow();

    expect(engine.ready).toBe(true);
    expect(engine.compoundParts).toEqual({});
    expect(engine.synonymMap.get("benzin")).toContain("kraftstoff");

    const { results } = await engine.search("schlauchverbindung", 10);
    expect(results.map((r) => r.notePath)).toContain(NOTE.notePath);
  });
});
