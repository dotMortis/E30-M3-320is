import { afterEach, beforeEach, vi } from "vitest";
import { resetObsidianMocks } from "../mocks/obsidian";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

type Retry = typeof import("../../http/retry");
export let requestUrlWithRetry: Retry["requestUrlWithRetry"];
export let RETRYABLE_STATUSES: Retry["RETRYABLE_STATUSES"];

beforeEach(async () => {
  resetObsidianMocks();
  const mod = await import("../../http/retry");
  requestUrlWithRetry = mod.requestUrlWithRetry;
  RETRYABLE_STATUSES = mod.RETRYABLE_STATUSES;
});

afterEach(() => {
  vi.useRealTimers();
});
