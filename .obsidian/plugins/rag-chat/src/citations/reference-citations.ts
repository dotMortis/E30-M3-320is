import type { ContextBlock } from "../retrieval/types";
import { renderCitationMatch } from "./util";

export function linkifyReferenceCitations(text: string, citations: ContextBlock[]): string {
  const referenceBlocks = citations.filter((b) => !b.seitencode);
  if (referenceBlocks.length === 0) return text;

  const byTitel = new Map<string, ContextBlock[]>();
  for (const block of referenceBlocks) {
    const list = byTitel.get(block.titel);
    if (list) list.push(block);
    else byTitel.set(block.titel, [block]);
  }

  return text.replace(/\[Referenz:\s*([^\]]+)\]/gi, (whole, inner: string) => {
    const titel = inner.trim();
    if (!titel) return whole;

    const rendered = renderCitationMatch(titel, byTitel.get(titel), (m) => m.notePath);
    return `[Referenz: ${rendered}]`;
  });
}
