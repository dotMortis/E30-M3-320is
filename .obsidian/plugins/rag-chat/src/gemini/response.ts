import type { GroundingChunk, GroundingSupport } from "./types";

export function mapGroundingChunks(rawChunks: Record<string, any>[]): GroundingChunk[] {
  return rawChunks.map((c) => ({
    uri: c.web?.uri ?? "",
    title: c.web?.title ?? c.web?.uri ?? "",
  }));
}

export function mapGroundingSupports(rawSupports: Record<string, any>[]): GroundingSupport[] {
  return rawSupports
    .filter(
      (s) =>
        typeof s.segment?.endIndex === "number" && Array.isArray(s.groundingChunkIndices) && s.groundingChunkIndices.length > 0,
    )
    .map((s) => ({
      startIndex: typeof s.segment?.startIndex === "number" ? s.segment.startIndex : 0,
      endIndex: s.segment.endIndex,
      chunkIndices: s.groundingChunkIndices,
      text: typeof s.segment?.text === "string" ? s.segment.text : undefined,
    }));
}
