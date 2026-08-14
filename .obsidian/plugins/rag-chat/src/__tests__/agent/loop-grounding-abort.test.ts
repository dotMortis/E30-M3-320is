import { describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { generateContentResponse } from "../mocks/gemini-http";
import { fetchMock, mockGenerationSequence } from "../mocks/fetch-sse";
import type { FuzzySearchApi } from "../../retrieval/types";
import { fakeSettings, makeCtx, requestBody, resumeAgentLoop, runAgentLoop } from "./loop-harness";

describe("runAgentLoop grounding & abort", () => {
  it("returns only the final round's groundingChunks/groundingSupports but accumulates webCitations across rounds", async () => {
    mockGenerationSequence([
      generateContentResponse({
        functionCalls: [{ name: "search_manual_fuzzy", args: { query: "a" } }],
        groundingChunks: [{ uri: "https://round1.example.com", title: "Round 1" }],
      }),
      generateContentResponse({
        text: "Antwort",
        groundingChunks: [{ uri: "https://round2.example.com", title: "Round 2" }],
      }),
    ]);
    const fuzzyApi: FuzzySearchApi = { search: vi.fn().mockResolvedValue({ results: [], correction: null }) };
    const ctx = await makeCtx({ fuzzyApi });
    const result = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    if (result.status !== "done") throw new Error("expected done");
    expect(result.webGroundingChunks).toEqual([{ uri: "https://round2.example.com", title: "Round 2" }]);
    expect(result.webCitations.map((c) => c.uri).sort()).toEqual([
      "https://round1.example.com",
      "https://round2.example.com",
    ]);
  });

  it("stops before executing further tool calls in the same round once aborted mid-round", async () => {
    mockGenerationSequence([
      generateContentResponse({
        functionCalls: [
          { name: "search_manual_fuzzy", args: { query: "benzin" } },
          {
            name: "get_manual_page",
            args: { notePath: "16-01.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank" },
          },
        ],
      }),
    ]);
    const controller = new AbortController();
    const readSpy = vi.fn().mockResolvedValue("Seiteninhalt");
    const throwinglessVault = { getFileByPath: () => ({ path: "16-01.md" }), read: readSpy };
    const fuzzyApi: FuzzySearchApi = {
      search: vi.fn().mockImplementation(async () => {
        controller.abort();
        return { results: [], correction: null };
      }),
    };
    const ctx = await makeCtx({ fuzzyApi, vault: throwinglessVault as unknown as Vault, signal: controller.signal });

    await expect(runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx })).rejects.toThrow(
      "Anfrage abgebrochen."
    );
    expect(readSpy).not.toHaveBeenCalled();
  });

  it("stops before the tools-budget-exhausted fallback call once aborted", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ name: "search_manual_fuzzy", args: { query: "a" } }] }),
    ]);
    const controller = new AbortController();
    const fuzzyApi: FuzzySearchApi = {
      search: vi.fn().mockImplementation(async () => {
        controller.abort();
        return { results: [], correction: null };
      }),
    };
    const ctx = await makeCtx({ fuzzyApi, settings: fakeSettings({ maxAgentRounds: 1 }), signal: controller.signal });

    await expect(runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx })).rejects.toThrow(
      "Anfrage abgebrochen."
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("snapshots settings at pause time: later mutation of the original settings object does not affect resume", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ name: "ask_user", args: { question: "Welches Baujahr?" } }] }),
    ]);
    const settings = fakeSettings({ maxAgentRounds: 4 });
    const ctx = await makeCtx({ settings });
    const paused = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    if (paused.status !== "awaiting_clarification") throw new Error("expected awaiting_clarification");

    settings.maxAgentRounds = 1;

    mockGenerationSequence([generateContentResponse({ text: "Antwort" })]);
    const resumed = await resumeAgentLoop(paused.pending, "1988");

    expect(resumed).toMatchObject({ status: "done", text: "Antwort" });
    expect(paused.pending.ctx.settings.maxAgentRounds).toBe(4);
  });
});
