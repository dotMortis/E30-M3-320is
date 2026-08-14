import { describe, expect, it, vi } from "vitest";
import { embedContentResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import type { FuzzySearchApi } from "../../retrieval/types";
import { executeTool, freshState, makeCtx } from "./execute-tool-harness";

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

  it("forwards ctx.signal to the embedding call, aborting immediately instead of waiting for a response", async () => {
    requestUrl.mockReturnValueOnce(new Promise(() => {}));
    const controller = new AbortController();
    const ctx = await makeCtx({ signal: controller.signal });
    const promise = executeTool({ name: "search_manual", args: { query: "Bremse" } }, ctx, freshState());
    controller.abort();
    await expect(promise).rejects.toThrow("Anfrage abgebrochen.");
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

describe("executeTool - unknown tool", () => {
  it("returns an error describing the unknown tool name", async () => {
    const ctx = await makeCtx();
    const result = await executeTool({ name: "not_a_real_tool", args: {} }, ctx, freshState());
    expect(result).toEqual({ error: "Unbekanntes Werkzeug: not_a_real_tool" });
  });
});
