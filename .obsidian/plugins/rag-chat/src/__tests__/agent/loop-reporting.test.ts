import { describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { generateContentResponse } from "../mocks/gemini-http";
import { mockGenerationSequence } from "../mocks/fetch-sse";
import { createStepReporter } from "../../agent/step-reporter";
import type { PipelineStep } from "../../retrieval/types";
import type { FuzzySearchApi } from "../../retrieval/types";
import { fakeSettings, makeCtx, runAgentLoop } from "./loop-harness";

describe("runAgentLoop step reporting", () => {
  function collectSteps(): { onStep: (step: PipelineStep) => void; steps: PipelineStep[] } {
    const steps: PipelineStep[] = [];
    const onStep = (step: PipelineStep) => {
      if (!steps.includes(step)) steps.push(step);
    };
    return { onStep, steps };
  }

  it("reports an llm_round step and a final_answer step, both attributed to the generation model", async () => {
    mockGenerationSequence([generateContentResponse({ text: "Direkte Antwort." })]);
    const { onStep, steps } = collectSteps();
    const ctx = await makeCtx({ reporter: createStepReporter(onStep), settings: fakeSettings({ generationModel: "gemini-3.6-flash" }) });
    await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });

    const roundStep = steps.find((s) => s.kind === "llm_round");
    expect(roundStep?.model).toBe("gemini-3.6-flash");
    expect(roundStep?.status).toBe("done");

    const finalStep = steps.find((s) => s.kind === "final_answer");
    expect(finalStep?.model).toBe("gemini-3.6-flash");
    expect(finalStep?.narration).toContain("Zeichen");
  });

  it("reports a tool_call step attributed to the embedding model for search_manual", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ name: "search_manual_fuzzy", args: { query: "benzin" } }] }),
      generateContentResponse({ text: "Fertig." }),
    ]);
    const { onStep, steps } = collectSteps();
    const fuzzyApi: FuzzySearchApi = {
      search: vi.fn().mockResolvedValue({
        results: [{ notePath: "tank.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank", rank: 0 }],
        correction: null,
      }),
    };
    const ctx = await makeCtx({ reporter: createStepReporter(onStep), fuzzyApi });
    await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });

    const toolStep = steps.find((s) => s.kind === "tool_call");
    expect(toolStep?.toolName).toBe("search_manual_fuzzy");
    expect(toolStep?.toolArgs).toEqual({ query: "benzin" });
    expect(toolStep?.status).toBe("done");
    expect(toolStep?.hits).toEqual([{ seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank" }]);
    expect(toolStep?.narration).toContain("Tank");
  });

  it("marks a tool_call step as failed with the error message when the tool throws", async () => {
    mockGenerationSequence([
      generateContentResponse({
        functionCalls: [{ name: "get_manual_page", args: { notePath: "16-01.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank" } }],
      }),
      generateContentResponse({ text: "Trotz Fehler fertig." }),
    ]);
    const { onStep, steps } = collectSteps();
    const throwingVault = {
      getFileByPath: () => ({ path: "16-01.md" }),
      read: () => {
        throw new Error("disk read failed");
      },
    };
    const ctx = await makeCtx({ reporter: createStepReporter(onStep), vault: throwingVault as unknown as Vault });
    await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });

    const toolStep = steps.find((s) => s.kind === "tool_call");
    expect(toolStep?.status).toBe("error");
    expect(toolStep?.errorMessage).toContain("disk read failed");
  });

  it("reports a clarification step when the model calls ask_user", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ name: "ask_user", args: { question: "Welches Baujahr?" } }] }),
    ]);
    const { onStep, steps } = collectSteps();
    const ctx = await makeCtx({ reporter: createStepReporter(onStep) });
    await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });

    const clarificationStep = steps.find((s) => s.kind === "clarification");
    expect(clarificationStep?.title).toContain("Welches Baujahr?");
    expect(clarificationStep?.status).toBe("done");
  });

  it("reports a budget_exhausted step followed by a forced llm_round and final_answer once maxAgentRounds is reached", async () => {
    mockGenerationSequence([
      generateContentResponse({ functionCalls: [{ name: "search_manual_fuzzy", args: { query: "a" } }] }),
      generateContentResponse({ text: "Erzwungene finale Antwort." }),
    ]);
    const { onStep, steps } = collectSteps();
    const fuzzyApi: FuzzySearchApi = { search: vi.fn().mockResolvedValue({ results: [], correction: null }) };
    const ctx = await makeCtx({ reporter: createStepReporter(onStep), fuzzyApi, settings: fakeSettings({ maxAgentRounds: 1 }) });
    await runAgentLoop({ question: "Frage?", history: [], baselineBlocks: [], ctx });

    expect(steps.some((s) => s.kind === "budget_exhausted")).toBe(true);
    const roundKinds = steps.filter((s) => s.kind === "llm_round");
    expect(roundKinds).toHaveLength(2);
    expect(steps.filter((s) => s.kind === "final_answer")).toHaveLength(1);
  });
});
