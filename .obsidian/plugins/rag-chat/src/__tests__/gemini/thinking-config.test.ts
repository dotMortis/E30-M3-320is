import { describe, expect, it } from "vitest";
import { buildThinkingConfig } from "../../gemini/thinking-config";

describe("buildThinkingConfig", () => {
  it("omits the config entirely when thinking is enabled, regardless of model", () => {
    expect(buildThinkingConfig("gemini-3.6-flash", true)).toBeUndefined();
    expect(buildThinkingConfig("gemini-2.5-flash", true)).toBeUndefined();
  });

  it("uses thinkingLevel 'low' for Gemini 3.x models when thinking is disabled", () => {
    expect(buildThinkingConfig("gemini-3.6-flash", false)).toEqual({ thinkingConfig: { thinkingLevel: "low" } });
    expect(buildThinkingConfig("gemini-3.1-pro-preview", false)).toEqual({
      thinkingConfig: { thinkingLevel: "low" },
    });
    expect(buildThinkingConfig("gemini-3-flash-preview", false)).toEqual({
      thinkingConfig: { thinkingLevel: "low" },
    });
  });

  it("uses thinkingBudget 0 for pre-Gemini-3 models when thinking is disabled", () => {
    expect(buildThinkingConfig("gemini-2.5-flash", false)).toEqual({ thinkingConfig: { thinkingBudget: 0 } });
    expect(buildThinkingConfig("gemini-1.5-flash", false)).toEqual({ thinkingConfig: { thinkingBudget: 0 } });
  });

  it("matches the Gemini 3 family case-insensitively", () => {
    expect(buildThinkingConfig("Gemini-3.6-Flash", false)).toEqual({ thinkingConfig: { thinkingLevel: "low" } });
  });
});
