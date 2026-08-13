import type { CompactHit, RetrievedHit } from "./types";

export function toCompactHits(hits: RetrievedHit[]): CompactHit[] {
  return hits.map((h) => ({ notePath: h.notePath, seitencode: h.seitencode, sektion: h.sektion, titel: h.titel }));
}
