import { toCompactHits } from "../retrieval/compact-hits";
import { embedQuery } from "../retrieval/embeddings";
import { federatedHybridSearch } from "../retrieval/hybrid-search";
import { readNoteOrNull } from "../retrieval/note-reader";
import type { AgentLoopContext, AgentLoopState } from "./types";

export async function executeTool(
  fc: { name: string; args: Record<string, unknown> },
  ctx: AgentLoopContext,
  state: AgentLoopState
): Promise<Record<string, unknown>> {
  switch (fc.name) {
    case "search_manual": {
      const query = String(fc.args?.query ?? "");
      if (!query.trim()) return { error: "query darf nicht leer sein." };
      const vector = await embedQuery(query, ctx.settings, ctx.onStatus);
      const hits = await federatedHybridSearch(ctx.indices, query, vector, ctx.settings);
      return { hits: toCompactHits(hits) };
    }
    case "search_manual_fuzzy": {
      if (!ctx.fuzzyApi) {
        return { error: "Das vault-search-Plugin ist nicht installiert/aktiviert - Werkzeug nicht verfügbar." };
      }
      const query = String(fc.args?.query ?? "");
      if (!query.trim()) return { error: "query darf nicht leer sein." };
      const res = await ctx.fuzzyApi.search(query, 10);
      return {
        hits: res.results.map((h) => ({ notePath: h.notePath, seitencode: h.seitencode, sektion: h.sektion, titel: h.titel })),
        correction: res.correction,
      };
    }
    case "get_manual_page": {
      const notePath = String(fc.args?.notePath ?? "");
      if (!notePath.trim()) return { error: "notePath darf nicht leer sein." };
      const fullText = await readNoteOrNull(ctx.vault, notePath);
      if (fullText === null) return { error: `Seite "${notePath}" nicht gefunden - evtl. verschoben oder gelöscht.` };
      const seitencode = String(fc.args?.seitencode ?? "");
      const sektion = String(fc.args?.sektion ?? "");
      const titel = String(fc.args?.titel ?? notePath);
      state.manualPages.set(notePath, { notePath, seitencode, sektion, titel, fullText });
      return { notePath, seitencode, sektion, titel, fullText };
    }
    default:
      return { error: `Unbekanntes Werkzeug: ${fc.name}` };
  }
}
