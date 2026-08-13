import { describe, expect, it } from "vitest";
import type { App } from "obsidian";
import { getFuzzySearchApi } from "../../view/fuzzy-search-plugin";
import type { FuzzySearchApi } from "../../retrieval/types";

describe("getFuzzySearchApi", () => {
  it("returns the vault-search plugin's api when installed and enabled", () => {
    const api: FuzzySearchApi = { search: async () => ({ results: [], correction: null }) };
    const app = { plugins: { plugins: { "vault-search": { api } } } } as unknown as App;
    expect(getFuzzySearchApi(app)).toBe(api);
  });

  it("returns null when vault-search is not among the installed plugins", () => {
    const app = { plugins: { plugins: {} } } as unknown as App;
    expect(getFuzzySearchApi(app)).toBeNull();
  });

  it("returns null when the plugins registry itself is absent", () => {
    const app = {} as unknown as App;
    expect(getFuzzySearchApi(app)).toBeNull();
  });

  it("returns null when vault-search is installed but exposes no api", () => {
    const app = { plugins: { plugins: { "vault-search": {} } } } as unknown as App;
    expect(getFuzzySearchApi(app)).toBeNull();
  });
});
