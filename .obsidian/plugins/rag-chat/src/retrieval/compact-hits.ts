import type { CompactHit } from "./types";

/** Structural source shape - matches both RetrievedHit (hybrid search) and
 * FuzzySearchHit (vault-search), so both retrieval paths can share this one
 * mapper down to the CompactHit shape returned to the model. */
type CompactHitSource = { notePath: string; seitencode: string; sektion: string; titel: string };

export function toCompactHits(hits: CompactHitSource[]): CompactHit[] {
  return hits.map((h) => ({ notePath: h.notePath, seitencode: h.seitencode, sektion: h.sektion, titel: h.titel }));
}
