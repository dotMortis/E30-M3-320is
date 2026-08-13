import type { ContextBlock } from "./types";

export function buildContextXml(blocks: ContextBlock[]): string {
  const parts = blocks.map(
    (b) =>
      `<document source="${b.notePath}" seitencode="${b.seitencode}" sektion="${b.sektion}" titel="${b.titel}">\n${b.fullText}\n</document>`
  );
  return `<context>\n${parts.join("\n\n")}\n</context>`;
}
