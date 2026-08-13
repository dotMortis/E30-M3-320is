import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { embedContentResponse, mockRequestUrlSequence } from "../mocks/gemini-http";
import { resetObsidianMocks } from "../mocks/obsidian";
import { fakeSettings } from "../fixtures/settings";
import { buildFakeIndices, fakeRow } from "../fixtures/build-indices";
import { createFakeVault } from "../mocks/fake-vault";
import type { AgentLoopContext, AgentLoopState } from "../../agent/types";
import type { FuzzySearchApi } from "../../retrieval/types";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let executeTool: typeof import("../../agent/execute-tool").executeTool;

beforeEach(async () => {
  resetObsidianMocks();
  ({ executeTool } = await import("../../agent/execute-tool"));
});

function freshState(): AgentLoopState {
  return { contents: [], round: 0, manualPages: new Map(), webCitations: new Map() };
}

async function makeCtx(overrides: Partial<AgentLoopContext> = {}): Promise<AgentLoopContext> {
  const indices = await buildFakeIndices([fakeRow({ rowId: "a", text: "Bremse wechseln" })]);
  return {
    settings: fakeSettings(),
    vault: createFakeVault([]) as unknown as Vault,
    indices,
    fuzzyApi: null,
    ...overrides,
  };
}

describe("executeTool - search_manual", () => {
  it("returns an error when query is empty", async () => {
    const ctx = await makeCtx();
    const result = await executeTool({ name: "search_manual", args: { query: "" } }, ctx, freshState());
    expect(result).toEqual({ error: "query darf nicht leer sein." });
  });

  it("returns an error when query is only whitespace", async () => {
    const ctx = await makeCtx();
    const result = await executeTool({ name: "search_manual", args: { query: "   " } }, ctx, freshState());
    expect(result.error).toBeDefined();
  });

  it("embeds the query and returns compact hits from federatedHybridSearch", async () => {
    mockRequestUrlSequence([embedContentResponse([1, 0, 0, 0])]);
    const ctx = await makeCtx();
    const result = await executeTool({ name: "search_manual", args: { query: "Bremse" } }, ctx, freshState());
    expect(Array.isArray(result.hits)).toBe(true);
    expect((result.hits as { notePath: string }[])[0]).toMatchObject({ notePath: "a.md" });
  });
});

describe("executeTool - search_manual_fuzzy", () => {
  it("returns an error when the fuzzy API is unavailable", async () => {
    const ctx = await makeCtx({ fuzzyApi: null });
    const result = await executeTool({ name: "search_manual_fuzzy", args: { query: "Bremse" } }, ctx, freshState());
    expect(result.error).toContain("vault-search-Plugin ist nicht installiert");
  });

  it("returns an error when query is empty even if the fuzzy API is available", async () => {
    const fuzzyApi: FuzzySearchApi = { search: vi.fn() };
    const ctx = await makeCtx({ fuzzyApi });
    const result = await executeTool({ name: "search_manual_fuzzy", args: { query: "" } }, ctx, freshState());
    expect(result).toEqual({ error: "query darf nicht leer sein." });
    expect(fuzzyApi.search).not.toHaveBeenCalled();
  });

  it("maps fuzzy API results to the compact hit shape plus correction", async () => {
    const fuzzyApi: FuzzySearchApi = {
      search: vi.fn().mockResolvedValue({
        results: [{ notePath: "tank.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank einbauen", rank: 0 }],
        correction: { from: "benzin", to: "kraftstoff" },
      }),
    };
    const ctx = await makeCtx({ fuzzyApi });
    const result = await executeTool({ name: "search_manual_fuzzy", args: { query: "benzin" } }, ctx, freshState());
    expect(result.hits).toEqual([{ notePath: "tank.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank einbauen" }]);
    expect(result.correction).toEqual({ from: "benzin", to: "kraftstoff" });
    expect(fuzzyApi.search).toHaveBeenCalledWith("benzin", 10);
  });
});

describe("executeTool - get_manual_page", () => {
  it("returns an error when notePath is empty", async () => {
    const ctx = await makeCtx();
    const result = await executeTool({ name: "get_manual_page", args: { notePath: "" } }, ctx, freshState());
    expect(result).toEqual({ error: "notePath darf nicht leer sein." });
  });

  it("returns an error when the note is not found in the vault", async () => {
    const ctx = await makeCtx({ vault: createFakeVault([]) as unknown as Vault });
    const result = await executeTool({ name: "get_manual_page", args: { notePath: "missing.md" } }, ctx, freshState());
    expect(result.error).toContain('"missing.md" nicht gefunden');
  });

  it("reads the note, stores it in state.manualPages, and returns its fields", async () => {
    const vault = createFakeVault([{ notePath: "16-01.md", content: "# Tank ausbauen\n\nSchritt 1" }]);
    const ctx = await makeCtx({ vault: vault as unknown as Vault });
    const state = freshState();
    const result = await executeTool(
      { name: "get_manual_page", args: { notePath: "16-01.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank ausbauen" } },
      ctx,
      state
    );
    expect(result).toEqual({
      notePath: "16-01.md",
      seitencode: "16-01",
      sektion: "Kraftstoff",
      titel: "Tank ausbauen",
      fullText: "# Tank ausbauen\n\nSchritt 1",
    });
    expect(state.manualPages.get("16-01.md")).toEqual({
      notePath: "16-01.md",
      seitencode: "16-01",
      sektion: "Kraftstoff",
      titel: "Tank ausbauen",
      fullText: "# Tank ausbauen\n\nSchritt 1",
    });
  });

  it("falls back to notePath as titel when titel arg is missing", async () => {
    const vault = createFakeVault([{ notePath: "16-01.md", content: "Inhalt" }]);
    const ctx = await makeCtx({ vault: vault as unknown as Vault });
    const result = await executeTool({ name: "get_manual_page", args: { notePath: "16-01.md" } }, ctx, freshState());
    expect(result.titel).toBe("16-01.md");
  });
});

describe("executeTool - unknown tool", () => {
  it("returns an error describing the unknown tool name", async () => {
    const ctx = await makeCtx();
    const result = await executeTool({ name: "not_a_real_tool", args: {} }, ctx, freshState());
    expect(result).toEqual({ error: "Unbekanntes Werkzeug: not_a_real_tool" });
  });
});
