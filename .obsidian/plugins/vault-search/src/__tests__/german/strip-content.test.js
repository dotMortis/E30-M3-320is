import { describe, it, expect } from "vitest";
import { stripForContent } from "../../german/strip-content.js";

describe("stripForContent", () => {
  it("removes YAML frontmatter", () => {
    const raw = "---\ntitel: Foo\n---\nHallo Welt";
    expect(stripForContent(raw)).toBe("Hallo Welt");
  });

  it("resolves wikilinks to their display text and drops embeds/markdown noise", () => {
    const raw = "Siehe ![[bild.png]] und [[13-710|Kraftstoffdruck]] # Ueberschrift";
    const out = stripForContent(raw);
    expect(out).toContain("Kraftstoffdruck");
    expect(out).not.toContain("[[");
    expect(out).not.toContain("![[");
  });
});
