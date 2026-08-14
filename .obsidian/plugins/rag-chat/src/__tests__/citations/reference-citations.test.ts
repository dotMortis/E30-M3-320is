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

  it("HTML-escapes an unmatched titel containing markup instead of injecting it raw", () => {
    const text = '[Referenz: "><img src=x onerror=alert(1)>]';
    const result = linkifyReferenceCitations(text, [REFERENCE_BLOCK]);
    expect(result).not.toContain("<img");
    expect(result).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(result).toContain("&quot;&gt;");
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

  it("renders an ambiguous titel (collision across >1 retrieved reference doc) as a details/summary block, disambiguated by notePath, not silently picking the first match", () => {
    const text = "Siehe [Referenz: Glossar]";
    const collisionBlock = { ...REFERENCE_BLOCK, titel: "Glossar", notePath: "Referenz/Glossar-B.md" };
    const namedBlock = { ...REFERENCE_BLOCK_TWO, titel: "Glossar" };
    const result = linkifyReferenceCitations(text, [namedBlock, collisionBlock]);
    expect(result).toContain('<details class="rag-chat-citation-ambiguous">');
    expect(result).toContain("<summary>Glossar</summary>");
    expect(result).toContain(`[[${namedBlock.notePath}|${namedBlock.notePath}]]`);
    expect(result).toContain(`[[${collisionBlock.notePath}|${collisionBlock.notePath}]]`);
  });
});
