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
    // Reference docs don't have a seitencode/sektion that reliably
    // disambiguates a titel collision (sektion is often the same generic
    // category, e.g. "Referenz", for every reference doc) - notePath is the
    // one field guaranteed to differ between two distinct colliding docs.
    const rendered = renderCitationMatch(titel, byTitel.get(titel), (m) => m.notePath);
    return `[Referenz: ${rendered}]`;
  });
}
