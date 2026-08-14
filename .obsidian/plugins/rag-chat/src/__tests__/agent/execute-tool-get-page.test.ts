import { describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { createFakeVault } from "../mocks/fake-vault";
import { executeTool, freshState, makeCtx } from "./execute-tool-harness";

describe("executeTool - get_manual_page", () => {
  it("returns an error when notePath is empty", async () => {
    const ctx = await makeCtx();
    const result = await executeTool(
      { name: "get_manual_page", args: { notePath: "", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank" } },
      ctx,
      freshState()
    );
    expect(result).toEqual({ error: "notePath darf nicht leer sein." });
  });

  it("returns an error when the note is not found in the vault", async () => {
    const ctx = await makeCtx({ vault: createFakeVault([]) as unknown as Vault });
    const result = await executeTool(
      { name: "get_manual_page", args: { notePath: "missing.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank" } },
      ctx,
      freshState()
    );
    expect(result.error).toContain('"missing.md" nicht gefunden');
  });

  it("reads the note, stores it in state.manualPages, and returns its fields", async () => {
    const vault = createFakeVault([{ notePath: "16-01.md", content: "# Tank ausbauen\n\nSchritt 1" }]);
    const ctx = await makeCtx({ vault: vault as unknown as Vault });
    const state = freshState();
    const result = await executeTool(
      { name: "get_manual_page", args: { notePath: "16-01.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank ausbauen" } },
      ctx,
      state
    );
    expect(result).toEqual({
      notePath: "16-01.md",
      seitencode: "16-01",
      sektion: "Kraftstoff",
      titel: "Tank ausbauen",
      fullText: "# Tank ausbauen\n\nSchritt 1",
    });
    expect(state.manualPages.get("16-01.md")).toEqual({
      notePath: "16-01.md",
      seitencode: "16-01",
      sektion: "Kraftstoff",
      titel: "Tank ausbauen",
      fullText: "# Tank ausbauen\n\nSchritt 1",
    });
  });

  it("accepts an explicitly-empty seitencode (reference-doc sources have no seitencode)", async () => {
    const vault = createFakeVault([{ notePath: "Referenz/Sonderwerkzeuge.md", content: "Inhalt" }]);
    const ctx = await makeCtx({ vault: vault as unknown as Vault });
    const result = await executeTool(
      {
        name: "get_manual_page",
        args: { notePath: "Referenz/Sonderwerkzeuge.md", seitencode: "", sektion: "Referenz", titel: "Sonderwerkzeuge" },
      },
      ctx,
      freshState()
    );
    expect(result).toEqual({
      notePath: "Referenz/Sonderwerkzeuge.md",
      seitencode: "",
      sektion: "Referenz",
      titel: "Sonderwerkzeuge",
      fullText: "Inhalt",
    });
  });

  it("rejects (rather than blank-defaults) a call missing the seitencode key entirely", async () => {
    const vault = createFakeVault([{ notePath: "16-01.md", content: "Inhalt" }]);
    const ctx = await makeCtx({ vault: vault as unknown as Vault });
    const state = freshState();
    const result = await executeTool(
      { name: "get_manual_page", args: { notePath: "16-01.md", sektion: "Kraftstoff", titel: "Tank" } },
      ctx,
      state
    );
    expect(result.error).toContain("seitencode");
    expect(state.manualPages.has("16-01.md")).toBe(false);
  });

  it("rejects a call missing the sektion key entirely", async () => {
    const ctx = await makeCtx();
    const result = await executeTool(
      { name: "get_manual_page", args: { notePath: "16-01.md", seitencode: "16-01", titel: "Tank" } },
      ctx,
      freshState()
    );
    expect(result.error).toContain("sektion");
  });

  it("rejects a call missing the titel key entirely", async () => {
    const ctx = await makeCtx();
    const result = await executeTool(
      { name: "get_manual_page", args: { notePath: "16-01.md", seitencode: "16-01", sektion: "Kraftstoff" } },
      ctx,
      freshState()
    );
    expect(result.error).toContain("titel");
  });

  it("rejects a blank (whitespace-only) sektion even though the key is present", async () => {
    const ctx = await makeCtx();
    const result = await executeTool(
      { name: "get_manual_page", args: { notePath: "16-01.md", seitencode: "16-01", sektion: "   ", titel: "Tank" } },
      ctx,
      freshState()
    );
    expect(result.error).toContain("sektion");
  });

  it("rejects a blank (whitespace-only) titel even though the key is present", async () => {
    const ctx = await makeCtx();
    const result = await executeTool(
      { name: "get_manual_page", args: { notePath: "16-01.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "  " } },
      ctx,
      freshState()
    );
    expect(result.error).toContain("titel");
  });

  it("does not overwrite an existing good manualPages entry when a later call for the same notePath fails validation", async () => {
    const vault = createFakeVault([{ notePath: "16-01.md", content: "Inhalt" }]);
    const ctx = await makeCtx({ vault: vault as unknown as Vault });
    const state = freshState();
    state.manualPages.set("16-01.md", {
      notePath: "16-01.md",
      seitencode: "16-01",
      sektion: "Kraftstoff",
      titel: "Tank ausbauen",
      fullText: "Inhalt",
    });
    await executeTool({ name: "get_manual_page", args: { notePath: "16-01.md" } }, ctx, state);
    expect(state.manualPages.get("16-01.md")).toEqual({
      notePath: "16-01.md",
      seitencode: "16-01",
      sektion: "Kraftstoff",
      titel: "Tank ausbauen",
      fullText: "Inhalt",
    });
  });
});

