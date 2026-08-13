import type { Vault } from "obsidian";
import { readNoteOrNull } from "./note-reader";
import type { ContextBlock, ReferenceChunkMap, RetrievedHit } from "./types";

export async function expandToParentNotes(
  hits: RetrievedHit[],
  vault: Vault,
  referenceChunks: ReferenceChunkMap
): Promise<ContextBlock[]> {
  const seen = new Set<string>();
  const blocks: ContextBlock[] = [];
  for (const hit of hits) {
    if (hit.kind === "reference") {
      if (seen.has(hit.rowId)) continue;
      seen.add(hit.rowId);
      const chunk = referenceChunks.get(hit.rowId);
      if (!chunk) continue;
      blocks.push({
        notePath: hit.notePath,
        seitencode: "",
        sektion: hit.sektion,
        titel: hit.titel,
        fullText: chunk.text,
      });
      continue;
    }
    if (seen.has(hit.notePath)) continue;
    seen.add(hit.notePath);
    const fullText = await readNoteOrNull(vault, hit.notePath);
    if (fullText === null) continue;
    blocks.push({
      notePath: hit.notePath,
      seitencode: hit.seitencode,
      sektion: hit.sektion,
      titel: hit.titel,
      fullText,
    });
  }
  return blocks;
}
