import { describe, expect, it } from "vitest";
import { buildWebCitationSnippets, linkifyWebCitations } from "../../citations/web-citations";
import type { GroundingChunk, GroundingSupport } from "../../gemini/types";

const CHUNKS: GroundingChunk[] = [
  { uri: "https://example.com/a", title: "Example A" },
  { uri: "https://example.com/b", title: "Example B" },
];

function byteIndexOf(text: string, substring: string): number {
  const charIndex = text.indexOf(substring);
  return new TextEncoder().encode(text.slice(0, charIndex)).length;
}

describe("linkifyWebCitations", () => {
  it("returns text unchanged when there are no chunks", () => {
    const text = "Zeile eins.";
    expect(linkifyWebCitations(text, [], [{ startIndex: 0, endIndex: 5, chunkIndices: [0] }])).toBe(text);
  });

  it("returns text unchanged when there are no supports", () => {
    const text = "Zeile eins.";
    expect(linkifyWebCitations(text, CHUNKS, [])).toBe(text);
  });

  it("wraps the full line containing the support's startIndex in a markdown link", () => {
    const text = "Zeile eins.\nZeile zwei ist die Zitatzeile.\nZeile drei.";
    const startIndex = byteIndexOf(text, "Zeile zwei");
    const supports: GroundingSupport[] = [{ startIndex, endIndex: startIndex + 5, chunkIndices: [0] }];
    const result = linkifyWebCitations(text, CHUNKS, supports);
    expect(result).toBe(
      "Zeile eins.\n[Zeile zwei ist die Zitatzeile.](https://example.com/a)\nZeile drei."
    );
  });

  it("keeps a leading list marker outside the link", () => {
    const text = "- **Titel** – Kanal: X (YouTube)";
    const startIndex = byteIndexOf(text, "Titel");
    const supports: GroundingSupport[] = [{ startIndex, endIndex: startIndex + 5, chunkIndices: [0] }];
    const result = linkifyWebCitations(text, CHUNKS, supports);
    expect(result.startsWith("- [")).toBe(true);
    expect(result).toContain("](https://example.com/a)");
  });

  it("correctly maps byte offsets across multi-byte UTF-8 characters", () => {
    const text = "Zeile eins.\nÖl prüfen und wechseln.\nZeile drei.";
    const startIndex = byteIndexOf(text, "prüfen");
    const supports: GroundingSupport[] = [{ startIndex, endIndex: startIndex + 6, chunkIndices: [0] }];
    const result = linkifyWebCitations(text, CHUNKS, supports);
    expect(result).toBe(
      "Zeile eins.\n[Öl prüfen und wechseln.](https://example.com/a)\nZeile drei."
    );
  });

  it("uses the first valid (non-empty uri) chunk among chunkIndices", () => {
    const chunksWithEmpty: GroundingChunk[] = [{ uri: "", title: "" }, CHUNKS[1]];
    const text = "Nur eine Zeile hier.";
    const supports: GroundingSupport[] = [{ startIndex: 0, endIndex: 5, chunkIndices: [0, 1] }];
    const result = linkifyWebCitations(text, chunksWithEmpty, supports);
    expect(result).toContain("(https://example.com/b)");
  });

  it("skips a support whose chunkIndices resolve to no valid uri", () => {
    const chunksAllEmpty: GroundingChunk[] = [{ uri: "", title: "" }];
    const text = "Nur eine Zeile hier.";
    const supports: GroundingSupport[] = [{ startIndex: 0, endIndex: 5, chunkIndices: [0] }];
    expect(linkifyWebCitations(text, chunksAllEmpty, supports)).toBe(text);
  });

  it("collapses two supports pointing into the same line into a single link", () => {
    const text = "Eine einzige Zeile mit zwei Zitaten drin.";
    const supports: GroundingSupport[] = [
      { startIndex: byteIndexOf(text, "einzige"), endIndex: 20, chunkIndices: [0] },
      { startIndex: byteIndexOf(text, "Zitaten"), endIndex: 40, chunkIndices: [1] },
    ];
    const result = linkifyWebCitations(text, CHUNKS, supports);
    expect(result.match(/\]\(https:\/\/example\.com\/[ab]\)/g)?.length).toBe(1);
  });

  it("skips an insertion whose line content is only whitespace", () => {
    const text = "Zeile eins.\n   \nZeile drei.";
    const startIndex = byteIndexOf(text, "   ");
    const supports: GroundingSupport[] = [{ startIndex, endIndex: startIndex + 1, chunkIndices: [0] }];
    expect(linkifyWebCitations(text, CHUNKS, supports)).toBe(text);
  });
});

describe("buildWebCitationSnippets", () => {
  it("returns an empty map when there are no supports with text", () => {
    const supports: GroundingSupport[] = [{ startIndex: 0, endIndex: 1, chunkIndices: [0] }];
    expect(buildWebCitationSnippets(CHUNKS, supports).size).toBe(0);
  });

  it("maps each cited uri to its support's excerpt text", () => {
    const supports: GroundingSupport[] = [
      { startIndex: 0, endIndex: 1, chunkIndices: [0], text: "Erste Erwähnung" },
      { startIndex: 5, endIndex: 6, chunkIndices: [1], text: "Zweite Erwähnung" },
    ];
    const snippets = buildWebCitationSnippets(CHUNKS, supports);
    expect(snippets.get("https://example.com/a")).toBe("Erste Erwähnung");
    expect(snippets.get("https://example.com/b")).toBe("Zweite Erwähnung");
  });

  it("keeps the first excerpt when the same uri is cited by multiple supports", () => {
    const supports: GroundingSupport[] = [
      { startIndex: 0, endIndex: 1, chunkIndices: [0], text: "Erste Erwähnung" },
      { startIndex: 5, endIndex: 6, chunkIndices: [0], text: "Spätere Erwähnung" },
    ];
    const snippets = buildWebCitationSnippets(CHUNKS, supports);
    expect(snippets.get("https://example.com/a")).toBe("Erste Erwähnung");
  });
});
