import { beforeEach, vi } from "vitest";
import { resetObsidianMocks } from "../mocks/obsidian";
import type { FunctionDeclaration, GeminiContent } from "../../gemini/types";

export { fakeSettings } from "../fixtures/settings";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

type Client = typeof import("../../gemini/client");
export let generateWithTools: Client["generateWithTools"];
export let generateWithToolsStreaming: Client["generateWithToolsStreaming"];

beforeEach(async () => {
  resetObsidianMocks();
  const mod = await import("../../gemini/client");
  generateWithTools = mod.generateWithTools;
  generateWithToolsStreaming = mod.generateWithToolsStreaming;
});

export const CONTENTS: GeminiContent[] = [{ role: "user", parts: [{ text: "Anzugsdrehmoment?" }] }];
export const SEARCH_MANUAL: FunctionDeclaration = { name: "search_manual", description: "d", parameters: {} };
