import type { App } from "obsidian";
import type { FuzzySearchApi } from "../retrieval/types";

export function getFuzzySearchApi(app: App): FuzzySearchApi | null {
  const plugins = (app as unknown as { plugins?: { plugins?: Record<string, { api?: FuzzySearchApi }> } }).plugins
    ?.plugins;
  return plugins?.["vault-search"]?.api ?? null;
}
