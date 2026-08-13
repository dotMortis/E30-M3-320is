import { describe, expect, it } from "vitest";
import { linkifyCitations } from "../../citations/page-citations";
import { ENGINE_OVERVIEW_BLOCK, TORQUE_BLOCK, TORQUE_COLLISION_BLOCK } from "../fixtures/context-blocks";

describe("linkifyCitations", () => {
  it("returns the text unchanged when there are no citations", () => {
    const text = "Siehe [Seite 11-09] für Details.";
    expect(linkifyCitations(text, [])).toBe(text);
  });

  it("links a single unambiguous seitencode match", () => {
    const text = "Siehe [Seite 11-09] für Details.";
    const result = linkifyCitations(text, [TORQUE_BLOCK]);
    expect(result).toBe(`Siehe [Seite [[${TORQUE_BLOCK.notePath}|11-09]]] für Details.`);
  });

  it("links multiple codes in one bracket, each resolved independently", () => {
    const text = "Siehe [Seite 11-09, 11-100] für Details.";
    const result = linkifyCitations(text, [TORQUE_BLOCK, ENGINE_OVERVIEW_BLOCK]);
    expect(result).toBe(
      `Siehe [Seite [[${TORQUE_BLOCK.notePath}|11-09]], [[${ENGINE_OVERVIEW_BLOCK.notePath}|11-100]]] für Details.`
    );
  });

  it("wraps a hallucinated/unmatched code in an unverified span", () => {
    const text = "Siehe [Seite 99-99] für Details.";
    const result = linkifyCitations(text, [TORQUE_BLOCK]);
    expect(result).toContain('<span class="rag-chat-citation-unverified"');
    expect(result).toContain(">99-99<");
    expect(result).not.toContain("[[");
  });

  it("renders an ambiguous seitencode (collision across >1 retrieved page) as a details/summary block", () => {
    const text = "Siehe [Seite 11-09] für Details.";
    const result = linkifyCitations(text, [TORQUE_BLOCK, TORQUE_COLLISION_BLOCK]);
    expect(result).toContain('<details class="rag-chat-citation-ambiguous">');
    expect(result).toContain("<summary>11-09</summary>");
    expect(result).toContain(`[[${TORQUE_BLOCK.notePath}|${TORQUE_BLOCK.sektion}]]`);
    expect(result).toContain(`[[${TORQUE_COLLISION_BLOCK.notePath}|${TORQUE_COLLISION_BLOCK.sektion}]]`);
  });

  it("is case-insensitive on the 'Seite' marker", () => {
    const text = "Siehe [SEITE 11-09] für Details.";
    const result = linkifyCitations(text, [TORQUE_BLOCK]);
    expect(result).toContain("[[");
  });

  it("trims whitespace around comma-separated codes", () => {
    const text = "Siehe [Seite 11-09 ,  11-100] für Details.";
    const result = linkifyCitations(text, [TORQUE_BLOCK, ENGINE_OVERVIEW_BLOCK]);
    expect(result).toContain(`[[${TORQUE_BLOCK.notePath}|11-09]]`);
    expect(result).toContain(`[[${ENGINE_OVERVIEW_BLOCK.notePath}|11-100]]`);
  });

  it("leaves non-matching text outside citation brackets untouched", () => {
    const text = "Vor dem Zitat. [Seite 11-09] Nach dem Zitat.";
    const result = linkifyCitations(text, [TORQUE_BLOCK]);
    expect(result.startsWith("Vor dem Zitat. ")).toBe(true);
    expect(result.endsWith(" Nach dem Zitat.")).toBe(true);
  });

  it("handles multiple separate citation brackets in the same text", () => {
    const text = "[Seite 11-09] und später [Seite 11-100]";
    const result = linkifyCitations(text, [TORQUE_BLOCK, ENGINE_OVERVIEW_BLOCK]);
    expect(result).toContain(`[[${TORQUE_BLOCK.notePath}|11-09]]`);
    expect(result).toContain(`[[${ENGINE_OVERVIEW_BLOCK.notePath}|11-100]]`);
  });
});
