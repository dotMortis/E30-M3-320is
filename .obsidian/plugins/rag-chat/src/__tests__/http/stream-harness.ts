import { afterEach, beforeEach, vi } from "vitest";
import { resetObsidianMocks } from "../mocks/obsidian";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

export let postSseWithRetry: typeof import("../../http/stream").postSseWithRetry;

beforeEach(async () => {
  resetObsidianMocks();
  postSseWithRetry = (await import("../../http/stream")).postSseWithRetry;
});

afterEach(() => {
  vi.useRealTimers();
});

export const PARAMS = { url: "https://example.com/stream", headers: {}, body: "{}" };
