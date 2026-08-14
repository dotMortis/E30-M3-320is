import { describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { generateContentResponse } from "../mocks/gemini-http";
import { fetchMock, mockGenerationSequence } from "../mocks/fetch-sse";
import type { FuzzySearchApi } from "../../retrieval/types";
import { fakeSettings, makeCtx, requestBody, resumeAgentLoop, runAgentLoop } from "./loop-harness";

describe("runAgentLoop tools", () => {
  it("filters out the search_manual_fuzzy declaration when enableFuzzySearchLeg is false", async () => {
    mockGenerationSequence([generateContentResponse({ text: "Antwort" })]);
    const ctx = await makeCtx({ settings: fakeSettings({ enableFuzzySearchLeg: false }) });
    await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    const body = requestBody(0);
    const declNames = body.tools.find((t: any) => t.functionDeclarations)?.functionDeclarations.map((d: any) => d.name);
    expect(declNames).not.toContain("search_manual_fuzzy");
    expect(declNames).toContain("search_manual");
  });

  it("recovers from a throwing tool call with a graceful error functionResponse instead of crashing the turn", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ name: "get_manual_page", args: { notePath: "16-01.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank" } }] }),
      generateContentResponse({ text: "Trotz Fehler fertig." }),
    ]);
    const throwingVault = {
      getFileByPath: () => ({ path: "16-01.md" }),
      read: () => {
        throw new Error("disk read failed");
      },
    };
    const ctx = await makeCtx({ vault: throwingVault as unknown as Vault });
    const result = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    expect(result).toMatchObject({ status: "done", text: "Trotz Fehler fertig." });

    const secondCallBody = requestBody(1);
    const functionResponsePart = secondCallBody.contents.at(-1).parts[0];
    expect(functionResponsePart.functionResponse.name).toBe("get_manual_page");
    expect(functionResponsePart.functionResponse.response.error).toContain("disk read failed");
  });

  it("executes other function calls and emits their functionResponses before pausing when ask_user is batched alongside them", async () => {
    mockGenerationSequence([
      generateContentResponse({
        functionCalls: [
          { name: "search_manual_fuzzy", args: { query: "benzin" } },
          { name: "ask_user", args: { question: "Welches Baujahr?" } },
        ],
      }),
    ]);
    const fuzzyApi: FuzzySearchApi = {
      search: vi.fn().mockResolvedValue({
        results: [{ notePath: "tank.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank", rank: 0 }],
        correction: null,
      }),
    };
    const ctx = await makeCtx({ fuzzyApi });
    const result = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    expect(result.status).toBe("awaiting_clarification");
    if (result.status !== "awaiting_clarification") throw new Error("expected awaiting_clarification");
    expect(result.question).toBe("Welches Baujahr?");

    const contents = result.pending.state.contents;
    const userTurn = contents.find(
      (c) => c.role === "user" && c.parts.some((p) => p.functionResponse?.name === "search_manual_fuzzy")
    );
    expect(userTurn).toBeDefined();
    expect(fuzzyApi.search).toHaveBeenCalledWith("benzin", 10);
  });

  it("echoes a functionCall's id back on its functionResponse when the model provided one", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ id: "call-123", name: "search_manual_fuzzy", args: { query: "benzin" } }] }),
      generateContentResponse({ text: "Fertig." }),
    ]);
    const fuzzyApi: FuzzySearchApi = { search: vi.fn().mockResolvedValue({ results: [], correction: null }) };
    const ctx = await makeCtx({ fuzzyApi });
    await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });

    const secondCallBody = requestBody(1);
    const functionResponsePart = secondCallBody.contents.at(-1).parts[0];
    expect(functionResponsePart.functionResponse.id).toBe("call-123");
  });

  it("omits the id field entirely when the model's functionCall had none", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ name: "search_manual_fuzzy", args: { query: "benzin" } }] }),
      generateContentResponse({ text: "Fertig." }),
    ]);
    const fuzzyApi: FuzzySearchApi = { search: vi.fn().mockResolvedValue({ results: [], correction: null }) };
    const ctx = await makeCtx({ fuzzyApi });
    await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });

    const secondCallBody = requestBody(1);
    const functionResponsePart = secondCallBody.contents.at(-1).parts[0];
    expect(functionResponsePart.functionResponse.id).toBeUndefined();
  });

  it("correlates the resumed ask_user functionResponse with its original functionCall's id", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ id: "ask-456", name: "ask_user", args: { question: "Welches Baujahr?" } }] }),
    ]);
    const ctx = await makeCtx();
    const paused = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    if (paused.status !== "awaiting_clarification") throw new Error("expected awaiting_clarification");

    mockGenerationSequence([generateContentResponse({ text: "Danke." })]);
    await resumeAgentLoop(paused.pending, "1988");

    const secondBody = requestBody(1);
    const functionResponsePart = secondBody.contents.at(-1).parts[0];
    expect(functionResponsePart.functionResponse.id).toBe("ask-456");
  });

});
