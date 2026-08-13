import { describe, expect, it } from "vitest";
import { describeCall, describeResult, mergeGrounding } from "../../agent/status-text";
import type { GroundingChunk } from "../../gemini/types";
import type { WebCitation } from "../../retrieval/types";

describe("mergeGrounding", () => {
  it("adds chunks with a non-empty uri into the map, keyed by uri", () => {
    const map = new Map<string, WebCitation>();
    mergeGrounding(map, [{ uri: "https://a.com", title: "A" }]);
    expect(map.get("https://a.com")).toEqual({ uri: "https://a.com", title: "A" });
  });

  it("skips chunks with an empty uri", () => {
    const map = new Map<string, WebCitation>();
    mergeGrounding(map, [{ uri: "", title: "Empty" }]);
    expect(map.size).toBe(0);
  });

  it("overwrites an existing entry for the same uri (last write wins)", () => {
    const map = new Map<string, WebCitation>();
    mergeGrounding(map, [{ uri: "https://a.com", title: "First" }]);
    mergeGrounding(map, [{ uri: "https://a.com", title: "Second" }]);
    expect(map.get("https://a.com")?.title).toBe("Second");
  });

  it("accumulates chunks across multiple calls (used across agent-loop rounds)", () => {
    const map = new Map<string, WebCitation>();
    mergeGrounding(map, [{ uri: "https://a.com", title: "A" }]);
    mergeGrounding(map, [{ uri: "https://b.com", title: "B" }]);
    expect(map.size).toBe(2);
  });

  it("does nothing for an empty chunks array", () => {
    const map = new Map<string, WebCitation>();
    mergeGrounding(map, []);
    expect(map.size).toBe(0);
  });
});

describe("describeCall", () => {
  it("describes search_manual with its query", () => {
    expect(describeCall({ name: "search_manual", args: { query: "Bremse" } })).toBe('durchsuche Handbuch nach "Bremse"');
  });

  it("describes search_manual_fuzzy with its query", () => {
    expect(describeCall({ name: "search_manual_fuzzy", args: { query: "Bremse" } })).toBe(
      'durchsuche Handbuch (tippfehlertolerant) nach "Bremse"'
    );
  });

  it("describes get_manual_page preferring seitencode over notePath", () => {
    expect(describeCall({ name: "get_manual_page", args: { seitencode: "16-01", notePath: "16-01.md" } })).toBe(
      "hole Seite 16-01"
    );
  });

  it("describes get_manual_page falling back to notePath when seitencode is missing", () => {
    expect(describeCall({ name: "get_manual_page", args: { notePath: "16-01.md" } })).toBe("hole Seite 16-01.md");
  });

  it("falls back to a generic description for an unknown tool name", () => {
    expect(describeCall({ name: "unknown_tool", args: {} })).toBe("führe unknown_tool aus");
  });

  it("handles a missing query gracefully for search_manual", () => {
    expect(describeCall({ name: "search_manual", args: {} })).toBe('durchsuche Handbuch nach ""');
  });
});

describe("describeResult", () => {
  it("reports the error message when the response has an error field", () => {
    expect(describeResult({ name: "search_manual", args: {} }, { error: "query darf nicht leer sein." })).toBe(
      "Fehler: query darf nicht leer sein."
    );
  });

  it("reports the hit count for search_manual", () => {
    expect(describeResult({ name: "search_manual", args: {} }, { hits: [1, 2, 3] })).toBe("3 Treffer");
  });

  it("reports the hit count for search_manual_fuzzy", () => {
    expect(describeResult({ name: "search_manual_fuzzy", args: {} }, { hits: [] })).toBe("0 Treffer");
  });

  it("treats a non-array hits field as 0 hits", () => {
    expect(describeResult({ name: "search_manual", args: {} }, {})).toBe("0 Treffer");
  });

  it("reports the loaded page for get_manual_page, preferring seitencode", () => {
    expect(describeResult({ name: "get_manual_page", args: {} }, { seitencode: "16-01", notePath: "16-01.md" })).toBe(
      "Seite geladen (16-01)"
    );
  });

  it("falls back to notePath for get_manual_page when seitencode is missing from the response", () => {
    expect(describeResult({ name: "get_manual_page", args: {} }, { notePath: "16-01.md" })).toBe(
      "Seite geladen (16-01.md)"
    );
  });

  it("returns a generic 'erledigt' for an unknown tool name", () => {
    expect(describeResult({ name: "unknown_tool", args: {} }, {})).toBe("erledigt");
  });
});
