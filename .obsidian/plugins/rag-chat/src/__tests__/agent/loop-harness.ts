import { beforeEach, vi } from "vitest";
import type { Vault } from "obsidian";
import { fetchMock, resetFetchMock } from "../mocks/fetch-sse";
import { resetObsidianMocks } from "../mocks/obsidian";
import { fakeSettings } from "../fixtures/settings";
import { buildFakeIndices } from "../fixtures/build-indices";
import { createFakeVault } from "../mocks/fake-vault";
import type { AgentLoopContext } from "../../agent/types";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

export { fakeSettings } from "../fixtures/settings";

export let runAgentLoop: typeof import("../../agent/loop").runAgentLoop;
export let resumeAgentLoop: typeof import("../../agent/loop").resumeAgentLoop;

beforeEach(async () => {
  resetObsidianMocks();
  resetFetchMock();
  const mod = await import("../../agent/loop");
  runAgentLoop = mod.runAgentLoop;
  resumeAgentLoop = mod.resumeAgentLoop;
});

export async function makeCtx(overrides: Partial<AgentLoopContext> = {}): Promise<AgentLoopContext> {
  const indices = await buildFakeIndices([]);
  return {
    settings: fakeSettings(),
    vault: createFakeVault([]) as unknown as Vault,
    indices,
    fuzzyApi: null,
    ...overrides,
  };
}

export function requestBody(callIndex: number): Record<string, any> {
  return JSON.parse((fetchMock.mock.calls[callIndex][1] as { body: string }).body);
}
