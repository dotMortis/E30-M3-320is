import type { ContextBlock } from "../retrieval/types";
import { escapeWikilinkPath } from "./util";

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

    const rendered = codes.map((code) => {
      const matches = bySeitencode.get(code);
      if (!matches) {
        return `<span class="rag-chat-citation-unverified" title="Konnte nicht gegen die abgerufenen Quellen dieser Antwort verifiziert werden">${code}</span>`;
      }
      if (matches.length === 1) {
        return `[[${escapeWikilinkPath(matches[0].notePath)}|${code}]]`;
      }
      const items = matches.map((m) => `[[${escapeWikilinkPath(m.notePath)}|${m.sektion}]]`).join(" · ");
      return `<details class="rag-chat-citation-ambiguous"><summary>${code}</summary>${items}</details>`;
    });

    return `[Seite ${rendered.join(", ")}]`;
  });
}
