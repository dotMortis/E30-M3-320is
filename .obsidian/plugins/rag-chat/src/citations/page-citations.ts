import type { ContextBlock } from "../retrieval/types";
import { renderCitationMatch } from "./util";

// Known limitation: matching against `bySeitencode`/`byTitel` (in
// reference-citations.ts) is exact-match, case- and whitespace-sensitive
// (beyond the single outer .trim() on the whole code/titel). A model
// response citing "11-09 " vs "11-09" or differing case would fall through
// to the "unverified" branch rather than matching. Not currently observed
// to be a real problem in practice (the model is instructed to echo codes
// verbatim from retrieved sources) - documented, not defended against.
export function linkifyCitations(text: string, citations: ContextBlock[]): string {
  if (citations.length === 0) return text;

  const bySeitencode = new Map<string, ContextBlock[]>();
  for (const block of citations) {
    const list = bySeitencode.get(block.seitencode);
    if (list) list.push(block);
    else bySeitencode.set(block.seitencode, [block]);
  }

  return text.replace(/\[Seite\s+([^\]]+)\]/gi, (whole, inner: string) => {
    const codes = inner
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (codes.length === 0) return whole;

    const rendered = codes.map((code) => renderCitationMatch(code, bySeitencode.get(code), (m) => m.sektion));
    return `[Seite ${rendered.join(", ")}]`;
  });
}
