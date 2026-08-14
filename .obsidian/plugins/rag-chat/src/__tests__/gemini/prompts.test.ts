import { describe, expect, it } from "vitest";
import { buildToolsSuffix, SYSTEM_PROMPT } from "../../gemini/prompts";
import { FUNCTION_DECLARATIONS } from "../../agent/tool-declarations";
import type { FunctionDeclaration } from "../../gemini/types";

const SEARCH_MANUAL: FunctionDeclaration = {
  name: "search_manual",
  description: "d",
  parameters: {},
};
const ASK_USER: FunctionDeclaration = {
  name: "ask_user",
  description: "d",
  parameters: {},
};
const UNKNOWN_TOOL: FunctionDeclaration = {
  name: "some_unknown_tool",
  description: "d",
  parameters: {},
};

describe("SYSTEM_PROMPT", () => {
  it("instructs the model to answer in German", () => {
    expect(SYSTEM_PROMPT).toContain("Antworte auf Deutsch.");
  });

  it("pins the exact '[Seite <code>]' citation format", () => {
    expect(SYSTEM_PROMPT).toContain('"[Seite <code>]"');
  });

  it("pins the exact '[Referenz: <titel>]' citation format for reference docs", () => {
    expect(SYSTEM_PROMPT).toContain('"[Referenz: <titel>]"');
  });

  it("contains no tool descriptions of its own (tools are appended dynamically)", () => {
    expect(SYSTEM_PROMPT).not.toContain("search_manual");
    expect(SYSTEM_PROMPT).not.toContain("google_search");
  });
});

describe("buildToolsSuffix", () => {
  it("tells the model no tools are available when neither google_search nor any declarations are given", () => {
    const suffix = buildToolsSuffix(null, false);
    expect(suffix).toContain("keine Werkzeuge (auch keine Websuche) zur Verfügung");
  });

  it("tells the model no tools are available for an empty declarations array with google search disabled", () => {
    const suffix = buildToolsSuffix([], false);
    expect(suffix).toContain("keine Werkzeuge");
  });

  it("describes google_search when includeGoogleSearch is true", () => {
    const suffix = buildToolsSuffix(null, true);
    expect(suffix).toContain("google_search: durchsucht das Web");
  });

  it("describes each declared function tool that has a known description", () => {
    const suffix = buildToolsSuffix([SEARCH_MANUAL, ASK_USER], false);
    expect(suffix).toContain("search_manual(query):");
    expect(suffix).toContain("ask_user(question):");
  });

  it("silently skips a declared tool with no known description", () => {
    const suffix = buildToolsSuffix([UNKNOWN_TOOL], false);
    expect(suffix).not.toContain("some_unknown_tool");
  });

  it("combines google_search and function declarations in one suffix", () => {
    const suffix = buildToolsSuffix([SEARCH_MANUAL], true);
    expect(suffix).toContain("google_search:");
    expect(suffix).toContain("search_manual(query):");
  });

  it("mentions a limited tool-call budget when tools are available", () => {
    const suffix = buildToolsSuffix([SEARCH_MANUAL], false);
    expect(suffix).toContain("begrenztes Budget an Werkzeug-Aufrufen");
  });

  it("starts with a double newline to cleanly separate from the base SYSTEM_PROMPT", () => {
    expect(buildToolsSuffix(null, true).startsWith("\n\n")).toBe(true);
    expect(buildToolsSuffix(null, false).startsWith("\n\n")).toBe(true);
  });

  it("derives each real tool's description text from FUNCTION_DECLARATIONS (single source of truth)", () => {
    const suffix = buildToolsSuffix(FUNCTION_DECLARATIONS, false);
    for (const decl of FUNCTION_DECLARATIONS) {
      // The declaration's own description text must appear verbatim in the
      // prompt suffix - i.e. it wasn't hand-duplicated/re-written separately.
      expect(suffix).toContain(decl.description);
    }
  });

  it("includes the real get_manual_page's actual parameter names in order", () => {
    const suffix = buildToolsSuffix(FUNCTION_DECLARATIONS, false);
    expect(suffix).toContain("get_manual_page(notePath, seitencode, sektion, titel):");
  });
});
