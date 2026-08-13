import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { generateContentResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import { resetObsidianMocks } from "../mocks/obsidian";
import { fakeSettings } from "../fixtures/settings";
import { buildFakeIndices } from "../fixtures/build-indices";
import { createFakeVault } from "../mocks/fake-vault";
import { TORQUE_BLOCK } from "../fixtures/context-blocks";
import type { AgentLoopContext } from "../../agent/types";
import type { FuzzySearchApi } from "../../retrieval/types";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let runAgentLoop: typeof import("../../agent/loop").runAgentLoop;
let resumeAgentLoop: typeof import("../../agent/loop").resumeAgentLoop;

beforeEach(async () => {
  resetObsidianMocks();
  ({ runAgentLoop, resumeAgentLoop } = await import("../../agent/loop"));
});

async function makeCtx(overrides: Partial<AgentLoopContext> = {}): Promise<AgentLoopContext> {
  const indices = await buildFakeIndices([]);
  return {
    settings: fakeSettings(),
    vault: createFakeVault([]) as unknown as Vault,
    indices,
    fuzzyApi: null,
    ...overrides,
  };
}

function requestBody(callIndex: number): Record<string, any> {
  return JSON.parse((requestUrl.mock.calls[callIndex][0] as { body: string }).body);
}

describe("runAgentLoop", () => {
  it("returns 'done' immediately when the first round has no function calls", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Direkte Antwort." })]);
    const ctx = await makeCtx();
    const result = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [TORQUE_BLOCK], ctx });
    expect(result).toMatchObject({ status: "done", text: "Direkte Antwort." });
  });

  it("seeds manualCitations from the baseline blocks", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    const ctx = await makeCtx();
    const result = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [TORQUE_BLOCK], ctx });
    if (result.status !== "done") throw new Error("expected done");
    expect(result.manualCitations).toEqual([TORQUE_BLOCK]);
  });

  it("embeds the baseline <context> and <question> into the first user content", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    const ctx = await makeCtx();
    await runAgentLoop({ question: "Wie viel Nm?", history: [], baselineBlocks: [TORQUE_BLOCK], ctx });
    const body = requestBody(0);
    const lastContent = body.contents[body.contents.length - 1];
    expect(lastContent.parts[0].text).toContain("<context>");
    expect(lastContent.parts[0].text).toContain(TORQUE_BLOCK.fullText);
    expect(lastContent.parts[0].text).toContain("<question>\nWie viel Nm?\n</question>");
  });

  it("includes prior chat history before the new question", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    const ctx = await makeCtx();
    await runAgentLoop({
      question: "Folgefrage?",
      history: [{ role: "user", text: "Erste Frage" }, { role: "assistant", text: "Erste Antwort" }],
      baselineBlocks: [],
      ctx,
    });
    const body = requestBody(0);
    expect(body.contents[0]).toEqual({ role: "user", parts: [{ text: "Erste Frage" }] });
    expect(body.contents[1]).toEqual({ role: "model", parts: [{ text: "Erste Antwort" }] });
  });

  it("pauses with 'awaiting_clarification' when the model calls ask_user", async () => {
    mockRequestUrlSequence([
      generateContentResponse({ functionCalls: [{ name: "ask_user", args: { question: "Welches Baujahr?" } }] }),
    ]);
    const ctx = await makeCtx();
    const result = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    expect(result.status).toBe("awaiting_clarification");
    if (result.status !== "awaiting_clarification") throw new Error("expected awaiting_clarification");
    expect(result.question).toBe("Welches Baujahr?");
    expect(result.pending.state.round).toBe(1);
  });

  it("falls back to a default clarifying question text when ask_user's args are missing", async () => {
    mockRequestUrlSequence([generateContentResponse({ functionCalls: [{ name: "ask_user", args: {} }] })]);
    const ctx = await makeCtx();
    const result = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    if (result.status !== "awaiting_clarification") throw new Error("expected awaiting_clarification");
    expect(result.question).toBe("Kannst du das bitte genauer beschreiben?");
  });

  it("executes a search_manual_fuzzy tool call and feeds the result back for a second round", async () => {
    mockRequestUrlSequence([
      generateContentResponse({ functionCalls: [{ name: "search_manual_fuzzy", args: { query: "benzin" } }] }),
      generateContentResponse({ text: "Fertige Antwort nach Suche." }),
    ]);
    const fuzzyApi: FuzzySearchApi = {
      search: vi.fn().mockResolvedValue({
        results: [{ notePath: "tank.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank", rank: 0 }],
        correction: null,
      }),
    };
    const ctx = await makeCtx({ fuzzyApi });
    const result = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    expect(result).toMatchObject({ status: "done", text: "Fertige Antwort nach Suche." });
    expect(fuzzyApi.search).toHaveBeenCalledWith("benzin", 10);

    const secondCallBody = requestBody(1);
    const functionResponsePart = secondCallBody.contents.at(-1).parts[0];
    expect(functionResponsePart.functionResponse.name).toBe("search_manual_fuzzy");
    expect(functionResponsePart.functionResponse.response.hits).toEqual([
      { notePath: "tank.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank" },
    ]);
  });

  it("forces a final tools-stripped answer once maxAgentRounds is exhausted", async () => {
    mockRequestUrlSequence([
      generateContentResponse({ functionCalls: [{ name: "search_manual_fuzzy", args: { query: "a" } }] }),
      generateContentResponse({ functionCalls: [{ name: "search_manual_fuzzy", args: { query: "b" } }] }),
      generateContentResponse({ text: "Erzwungene finale Antwort." }),
    ]);
    const fuzzyApi: FuzzySearchApi = { search: vi.fn().mockResolvedValue({ results: [], correction: null }) };
    const ctx = await makeCtx({ fuzzyApi, settings: fakeSettings({ maxAgentRounds: 2 }) });
    const result = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    expect(result).toMatchObject({ status: "done", text: "Erzwungene finale Antwort." });
    expect(requestUrl).toHaveBeenCalledTimes(3);

    const finalBody = requestBody(2);
    expect(finalBody.tools).toBeUndefined();
    expect(finalBody.contents.at(-1).parts[0].text).toContain("Werkzeug-Budget für diese Frage ist aufgebraucht");
  });

  it("filters out the search_manual_fuzzy declaration when enableFuzzySearchLeg is false", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    const ctx = await makeCtx({ settings: fakeSettings({ enableFuzzySearchLeg: false }) });
    await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    const body = requestBody(0);
    const declNames = body.tools.find((t: any) => t.functionDeclarations)?.functionDeclarations.map((d: any) => d.name);
    expect(declNames).not.toContain("search_manual_fuzzy");
    expect(declNames).toContain("search_manual");
  });

  it("returns only the final round's groundingChunks/groundingSupports but accumulates webCitations across rounds", async () => {
    mockRequestUrlSequence([
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
});

describe("resumeAgentLoop", () => {
  it("feeds the user's answer back as the ask_user functionResponse and continues the same round budget", async () => {
    mockRequestUrlSequence([
      generateContentResponse({ functionCalls: [{ name: "ask_user", args: { question: "Welches Baujahr?" } }] }),
    ]);
    const ctx = await makeCtx();
    const paused = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    if (paused.status !== "awaiting_clarification") throw new Error("expected awaiting_clarification");

    mockRequestUrlSequence([generateContentResponse({ text: "Danke, hier die Antwort für 1988er Modelle." })]);
    const resumed = await resumeAgentLoop(paused.pending, "1988");

    expect(resumed).toMatchObject({ status: "done", text: "Danke, hier die Antwort für 1988er Modelle." });
    const secondBody = requestBody(1);
    const functionResponsePart = secondBody.contents.at(-1).parts[0];
    expect(functionResponsePart.functionResponse).toEqual({ name: "ask_user", response: { answer: "1988" } });
  });

  it("continues counting rounds from where the pause happened rather than resetting", async () => {
    mockRequestUrlSequence([
      generateContentResponse({ functionCalls: [{ name: "ask_user", args: { question: "Welches Baujahr?" } }] }),
    ]);
    const ctx = await makeCtx({ settings: fakeSettings({ maxAgentRounds: 2 }) });
    const paused = await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });
    if (paused.status !== "awaiting_clarification") throw new Error("expected awaiting_clarification");
    expect(paused.pending.state.round).toBe(1);

    mockRequestUrlSequence([generateContentResponse({ text: "Zweite Runde Antwort." })]);
    const resumed = await resumeAgentLoop(paused.pending, "1988");
    expect(resumed).toMatchObject({ status: "done", text: "Zweite Runde Antwort." });
    expect(paused.pending.state.round).toBe(2);
  });
});
