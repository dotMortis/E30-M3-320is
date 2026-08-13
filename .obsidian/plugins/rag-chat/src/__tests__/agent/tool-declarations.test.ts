import { describe, expect, it } from "vitest";
import { FUNCTION_DECLARATIONS } from "../../agent/tool-declarations";

describe("FUNCTION_DECLARATIONS", () => {
  it("declares exactly the four agent tools", () => {
    expect(FUNCTION_DECLARATIONS.map((d) => d.name)).toEqual([
      "search_manual",
      "search_manual_fuzzy",
      "get_manual_page",
      "ask_user",
    ]);
  });

  it("requires 'query' for search_manual", () => {
    const decl = FUNCTION_DECLARATIONS.find((d) => d.name === "search_manual")!;
    expect(decl.parameters.required).toEqual(["query"]);
  });

  it("requires 'query' for search_manual_fuzzy", () => {
    const decl = FUNCTION_DECLARATIONS.find((d) => d.name === "search_manual_fuzzy")!;
    expect(decl.parameters.required).toEqual(["query"]);
  });

  it("requires notePath/seitencode/sektion/titel for get_manual_page", () => {
    const decl = FUNCTION_DECLARATIONS.find((d) => d.name === "get_manual_page")!;
    expect(decl.parameters.required).toEqual(["notePath", "seitencode", "sektion", "titel"]);
  });

  it("requires 'question' for ask_user", () => {
    const decl = FUNCTION_DECLARATIONS.find((d) => d.name === "ask_user")!;
    expect(decl.parameters.required).toEqual(["question"]);
  });

  it("gives every declaration a non-empty description", () => {
    for (const decl of FUNCTION_DECLARATIONS) {
      expect(decl.description.length).toBeGreaterThan(0);
    }
  });
});
