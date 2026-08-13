import type { GroundingChunk, GroundingSupport } from "./gemini";
import type { ContextBlock } from "./retriever";

function escapeWikilinkPath(notePath: string): string {
  // Escape "|" defensively - real vault notePaths never contain it, but a
  // broken link is better than a broken render.
  return notePath.replace(/\|/g, "\\|");
}

/**
 * Turns the model's inline "[Seite <code>]" / "[Seite <code1>, <code2>]"
 * citations (see gemini.ts's SYSTEM_PROMPT, which pins this exact bracket
 * format) into real Obsidian `[[wikilink]]`s pointing at the cited page's
 * `notePath`, so they render as clickable/hoverable internal links via
 * view.ts's MarkdownRenderer.render (+ its wireInternalLinks post-processing
 * pass, required for links to actually be clickable inside a custom
 * ItemView - see view.ts's doc) - the same navigation mechanism already
 * used by the "Quellen (Handbuch)" citation chips below the answer.
 *
 * Deliberately deterministic/code-driven rather than trusting the model to
 * reproduce a `notePath` verbatim inline: only codes that exactly match a
 * seitencode from THIS turn's actually-retrieved `citations` become links.
 *
 * Three outcomes per code:
 *  - Exactly one match: a normal `[[notePath|code]]` link.
 *  - Zero matches (hallucinated/typo'd - not among this turn's retrieved
 *    sources): wrapped in a `rag-chat-citation-unverified` span instead of
 *    linked or silently passed through, so it's visually obvious it
 *    couldn't be verified.
 *  - Multiple matches (the same seitencode genuinely collides across >1
 *    retrieved page - see PLAN.md's "47 seitencodes collide" note, e.g. a
 *    main manual section page and its torque-spec-appendix twin sharing a
 *    code): rendered as an expandable `<details>` listing every candidate
 *    as its own real link (labeled by `sektion`), so the user can pick the
 *    right one instead of either guessing silently or being told a real
 *    page is "unverified".
 */
export function linkifyCitations(text: string, citations: ContextBlock[]): string {
  if (citations.length === 0) return text;

  const bySeitencode = new Map<string, ContextBlock[]>();
  for (const block of citations) {
    const list = bySeitencode.get(block.seitencode);
    if (list) list.push(block);
    else bySeitencode.set(block.seitencode, [block]);
  }

  return text.replace(/\[Seite\s+([^\]]+)\]/gi, (whole, inner: string) => {
    const codes = inner.split(",").map((c) => c.trim()).filter((c) => c.length > 0);
    if (codes.length === 0) return whole;

    const rendered = codes.map((code) => {
      const matches = bySeitencode.get(code);
      if (!matches) {
        return `<span class="rag-chat-citation-unverified" title="Konnte nicht gegen die abgerufenen Quellen dieser Antwort verifiziert werden">${code}</span>`;
      }
      if (matches.length === 1) {
        return `[[${escapeWikilinkPath(matches[0].notePath)}|${code}]]`;
      }
      // Ambiguous - real page(s) exist, but this seitencode isn't unique
      // among what was actually retrieved this turn. Offer every candidate
      // rather than silently guessing or flagging a real page as broken.
      const items = matches
        .map((m) => `[[${escapeWikilinkPath(m.notePath)}|${m.sektion}]]`)
        .join(" · ");
      return `<details class="rag-chat-citation-ambiguous"><summary>${code}</summary>${items}</details>`;
    });

    return `[Seite ${rendered.join(", ")}]`;
  });
}

const LEADING_LIST_MARKER_RE = /^([ \t]*(?:[-*+]|\d+[.)])[ \t]+)/;

/** Finds the single line containing `pos`, and splits it into a leading
 * list-marker/indentation prefix (kept OUTSIDE any link wrap, so a bullet's
 * "- " or "1. " marker never ends up inside `[...]` link text - which would
 * break that line's recognition as a list item entirely) and the rest of
 * the line's actual content. */
function safeLineContentSpan(text: string, pos: number): [number, number] {
  let lineStart = pos;
  while (lineStart > 0 && text[lineStart - 1] !== "\n") lineStart--;
  let lineEnd = pos;
  while (lineEnd < text.length && text[lineEnd] !== "\n") lineEnd++;
  const line = text.slice(lineStart, lineEnd);
  const markerMatch = LEADING_LIST_MARKER_RE.exec(line);
  const contentStart = lineStart + (markerMatch ? markerMatch[0].length : 0);
  return [contentStart, lineEnd];
}

/**
 * Turns Gemini's Google Search grounding attributions (groundingSupports,
 * see gemini.ts's doc) into real inline links wrapping the actual cited
 * line of the model's answer, instead of the disconnected, unlabeled
 * "Quellen (Web)" list (whose chunk titles are usually just a bare domain
 * like "youtube.com" - useless for telling entries apart, see view.ts).
 *
 * Segment offsets are Google's choice for citation ATTRIBUTION, not for
 * safe Markdown splicing - they can land mid-token (e.g. inside a
 * "**bold**" run). To stay safe, each support is snapped OUTWARD to the
 * single full line containing its start offset (see safeLineContentSpan)
 * rather than wrapping the exact byte-precise span - trading a little
 * precision for guaranteed-valid Markdown. In this vault's typical
 * "- **Titel** – Kanal: X (YouTube)" bullet structure, that line already
 * IS the whole visible video entry, so the loss is minor in practice.
 */
export function linkifyWebCitations(text: string, chunks: GroundingChunk[], supports: GroundingSupport[]): string {
  if (chunks.length === 0 || supports.length === 0) return text;

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const bytes = encoder.encode(text);

  function byteOffsetToStringIndex(byteIdx: number): number {
    const clamped = Math.max(0, Math.min(byteIdx, bytes.length));
    return decoder.decode(bytes.subarray(0, clamped)).length;
  }

  function firstValidUrl(chunkIndices: number[]): string | null {
    for (const i of chunkIndices) {
      const uri = chunks[i]?.uri;
      if (uri) return uri;
    }
    return null;
  }

  interface Insertion {
    start: number;
    end: number;
    url: string;
  }
  const insertions: Insertion[] = [];
  for (const support of supports) {
    const url = firstValidUrl(support.chunkIndices);
    if (!url) continue;
    const startIdx = byteOffsetToStringIndex(support.startIndex);
    const [contentStart, lineEnd] = safeLineContentSpan(text, startIdx);
    if (lineEnd <= contentStart) continue;
    insertions.push({ start: contentStart, end: lineEnd, url });
  }
  if (insertions.length === 0) return text;

  // Splice back-to-front (descending start) so earlier offsets never shift
  // under us. Skip any insertion overlapping one already applied (same
  // line cited by >1 support - first one wins rather than double-wrapping).
  insertions.sort((a, b) => b.start - a.start);
  let result = text;
  let earliestAppliedStart = Infinity;
  for (const ins of insertions) {
    if (ins.end > earliestAppliedStart) continue;
    const middle = result.slice(ins.start, ins.end);
    if (!middle.trim()) continue;
    result = `${result.slice(0, ins.start)}[${middle}](${ins.url})${result.slice(ins.end)}`;
    earliestAppliedStart = ins.start;
  }
  return result;
}

/**
 * Best-effort human-readable snippet per cited URL, drawn from
 * groundingSupports' literal excerpt text (see GroundingSupport.text) -
 * used only to make the fallback "Quellen (Web)" list (view.ts) less
 * opaque than Google's generic per-chunk titles (often just a bare domain
 * like "youtube.com" for every entry, with nothing to tell them apart).
 */
export function buildWebCitationSnippets(chunks: GroundingChunk[], supports: GroundingSupport[]): Map<string, string> {
  const snippets = new Map<string, string>();
  for (const support of supports) {
    if (!support.text) continue;
    for (const i of support.chunkIndices) {
      const uri = chunks[i]?.uri;
      if (uri && !snippets.has(uri)) snippets.set(uri, support.text);
    }
  }
  return snippets;
}
