const GEMINI_3_PATTERN = /^gemini-3/i;

export function buildThinkingConfig(model: string, thinkingEnabled: boolean): Record<string, unknown> | undefined {
  if (thinkingEnabled) return undefined;
  if (GEMINI_3_PATTERN.test(model)) {
    return { thinkingConfig: { thinkingLevel: "low" } };
  }
  return { thinkingConfig: { thinkingBudget: 0 } };
}
