import { describe, expect, it } from "vitest";
import { buildContextXml } from "../../retrieval/context-xml";
import { REFERENCE_BLOCK, TORQUE_BLOCK } from "../fixtures/context-blocks";

describe("buildContextXml", () => {
  it("wraps an empty block list in an empty <context> element", () => {
    expect(buildContextXml([])).toBe("<context>\n\n</context>");
  });

  it("renders a single block as a <document> with all metadata attributes", () => {
    const xml = buildContextXml([TORQUE_BLOCK]);
    expect(xml).toBe(
      `<context>\n<document source="${TORQUE_BLOCK.notePath}" seitencode="${TORQUE_BLOCK.seitencode}" sektion="${TORQUE_BLOCK.sektion}" titel="${TORQUE_BLOCK.titel}">\n${TORQUE_BLOCK.fullText}\n</document>\n</context>`
    );
  });

  it("joins multiple blocks with a blank line between <document> entries", () => {
    const xml = buildContextXml([TORQUE_BLOCK, REFERENCE_BLOCK]);
    const [, middle] = xml.split("<document");
    expect(xml).toContain("</document>\n\n<document");
    expect(middle).toBeDefined();
  });

  it("renders an empty seitencode attribute for reference-doc blocks", () => {
    const xml = buildContextXml([REFERENCE_BLOCK]);
    expect(xml).toContain('seitencode=""');
    expect(xml).toContain(`titel="${REFERENCE_BLOCK.titel}"`);
  });
});
