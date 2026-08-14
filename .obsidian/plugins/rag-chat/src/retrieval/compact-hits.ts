import type { CompactHit } from "./types";

type CompactHitSource = { notePath: string; seitencode: string; sektion: string; titel: string };

export function toCompactHits(hits: CompactHitSource[]): CompactHit[] {
  return hits.map((h) => ({ notePath: h.notePath, seitencode: h.seitencode, sektion: h.sektion, titel: h.titel }));
}
