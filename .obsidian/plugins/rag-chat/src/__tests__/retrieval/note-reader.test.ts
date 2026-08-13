import { describe, expect, it } from "vitest";
import type { Vault } from "obsidian";
import { readNoteOrNull } from "../../retrieval/note-reader";
import { createFakeVault } from "../mocks/fake-vault";

describe("readNoteOrNull", () => {
  it("returns the note's full text when the file exists", async () => {
    const vault = createFakeVault([{ notePath: "16-01.md", content: "# Tank ausbauen\n\nSchritt 1" }]);
    const result = await readNoteOrNull(vault as unknown as Vault, "16-01.md");
    expect(result).toBe("# Tank ausbauen\n\nSchritt 1");
  });

  it("returns null when the note no longer exists in the vault", async () => {
    const vault = createFakeVault([]);
    const result = await readNoteOrNull(vault as unknown as Vault, "moved-or-deleted.md");
    expect(result).toBeNull();
  });

  it("returns an empty string (not null) for a note that exists but is empty", async () => {
    const vault = createFakeVault([{ notePath: "empty.md", content: "" }]);
    const result = await readNoteOrNull(vault as unknown as Vault, "empty.md");
    expect(result).toBe("");
  });
});
