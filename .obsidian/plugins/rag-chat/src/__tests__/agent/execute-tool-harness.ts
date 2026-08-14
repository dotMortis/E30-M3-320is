import { beforeEach, vi } from "vitest";
import type { Vault } from "obsidian";
import { resetObsidianMocks } from "../mocks/obsidian";
import { fakeSettings } from "../fixtures/settings";
import { buildFakeIndices, fakeRow } from "../fixtures/build-indices";
import { createFakeVault } from "../mocks/fake-vault";
import type { AgentLoopContext, AgentLoopState } from "../../agent/types";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

export let executeTool: typeof import("../../agent/execute-tool").executeTool;

beforeEach(async () => {
  resetObsidianMocks();
  executeTool = (await import("../../agent/execute-tool")).executeTool;
});

export function freshState(): AgentLoopState {
  return { contents: [], round: 0, manualPages: new Map(), webCitations: new Map() };
}

export async function makeCtx(overrides: Partial<AgentLoopContext> = {}): Promise<AgentLoopContext> {
  const indices = await buildFakeIndices([fakeRow({ rowId: "a", text: "Bremse wechseln" })]);
  return {
    settings: fakeSettings(),
    vault: createFakeVault([]) as unknown as Vault,
    indices,
    fuzzyApi: null,
    ...overrides,
  };
}
