import { describe, expect, it } from "vitest";
import { linkifyReferenceCitations } from "../../citations/reference-citations";
import { REFERENCE_BLOCK, REFERENCE_BLOCK_TWO, TORQUE_BLOCK } from "../fixtures/context-blocks";

describe("linkifyReferenceCitations", () => {
  it("returns text unchanged when there are no reference-doc citations (all have a seitencode)", () => {
    const text = "Siehe [Referenz: Sonderwerkzeuge]";
    expect(linkifyReferenceCitations(text, [TORQUE_BLOCK])).toBe(text);
  });

  it("links a single unambiguous titel match", () => {
    const text = "Siehe [Referenz: Sonderwerkzeuge] für das Werkzeug.";
    const result = linkifyReferenceCitations(text, [REFERENCE_BLOCK]);
    expect(result).toBe(`Siehe [Referenz: [[${REFERENCE_BLOCK.notePath}|Sonderwerkzeuge]]] für das Werkzeug.`);
  });

  it("wraps an unmatched titel in an unverified span", () => {
    const text = "Siehe [Referenz: Unbekanntes Dokument]";
    const result = linkifyReferenceCitations(text, [REFERENCE_BLOCK]);
    expect(result).toContain('<span class="rag-chat-citation-unverified"');
    expect(result).toContain(">Unbekanntes Dokument<");
  });

  it("only considers blocks with an empty seitencode", () => {
    const text = "[Referenz: Sonderwerkzeuge]";
    const result = linkifyReferenceCitations(text, [TORQUE_BLOCK, REFERENCE_BLOCK]);
    expect(result).toContain(`[[${REFERENCE_BLOCK.notePath}|Sonderwerkzeuge]]`);
  });

  it("resolves multiple distinct reference docs independently", () => {
    const text = "[Referenz: Sonderwerkzeuge] und [Referenz: Glossar A-D]";
    const result = linkifyReferenceCitations(text, [REFERENCE_BLOCK, REFERENCE_BLOCK_TWO]);
    expect(result).toContain(`[[${REFERENCE_BLOCK.notePath}|Sonderwerkzeuge]]`);
    expect(result).toContain(`[[${REFERENCE_BLOCK_TWO.notePath}|Glossar A-D]]`);
  });

  it("trims whitespace around the titel", () => {
    const text = "[Referenz:   Sonderwerkzeuge  ]";
    const result = linkifyReferenceCitations(text, [REFERENCE_BLOCK]);
    expect(result).toContain(`[[${REFERENCE_BLOCK.notePath}|Sonderwerkzeuge]]`);
  });

  it("is case-insensitive on the 'Referenz' marker", () => {
    const text = "[REFERENZ: Sonderwerkzeuge]";
    const result = linkifyReferenceCitations(text, [REFERENCE_BLOCK]);
    expect(result).toContain("[[");
  });
});
