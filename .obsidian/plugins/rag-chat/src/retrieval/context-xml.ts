import type { ContextBlock } from "./types";

/**
 * Escapes text before it's interpolated into the pseudo-XML context block
 * sent to the model. Without this, a note containing a literal `</document>`
 * or stray `<`/`>` could corrupt document-boundary attribution in the
 * prompt (letting note content masquerade as a different/additional
 * <document> block, or break out of an attribute).
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildContextXml(blocks: ContextBlock[]): string {
  const parts = blocks.map(
    (b) =>
      `<document source="${escapeXml(b.notePath)}" seitencode="${escapeXml(b.seitencode)}" sektion="${escapeXml(b.sektion)}" titel="${escapeXml(b.titel)}">\n${escapeXml(b.fullText)}\n</document>`
  );
  return `<context>\n${parts.join("\n\n")}\n</context>`;
}
