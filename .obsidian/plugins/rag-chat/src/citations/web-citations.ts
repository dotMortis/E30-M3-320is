import type { GroundingChunk, GroundingSupport } from "../gemini/types";

const LEADING_LIST_MARKER_RE = /^([ \t]*(?:[-*+]|\d+[.)])[ \t]+)/;

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
