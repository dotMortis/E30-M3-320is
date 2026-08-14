import { toCompactHits } from "../retrieval/compact-hits";
import { embedQuery } from "../retrieval/embeddings";
import { federatedHybridSearch } from "../retrieval/hybrid-search";
import { readNoteOrNull } from "../retrieval/note-reader";
import { FUZZY_LEG_RESULT_LIMIT } from "../constants";
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
      const res = await ctx.fuzzyApi.search(query, FUZZY_LEG_RESULT_LIMIT);
      return {
        hits: toCompactHits(res.results),
        correction: res.correction,
      };
    }
    case "get_manual_page": {
      const notePath = String(fc.args?.notePath ?? "").trim();
      if (!notePath) return { error: "notePath darf nicht leer sein." };

      // `seitencode` may legitimately be an empty string (reference-doc
      // sources have no seitencode) - so only reject when the key is
      // entirely absent from the call's args, not merely empty. `sektion`
      // and `titel` are never legitimately blank for a real hit, so those
      // are rejected on either an absent key or a blank value. This avoids
      // silently blank-defaulting missing values and overwriting a good
      // baseline ContextBlock (from earlier retrieval) with empty metadata.
      const args = fc.args ?? {};
      const missingKeys = ["seitencode", "sektion", "titel"].filter((key) => !(key in args));
      if (missingKeys.length > 0) {
        return {
          error:
            `Fehlende Pflichtangabe(n): ${missingKeys.join(", ")}. Gib exakt die notePath/seitencode/sektion/titel-` +
            "Werte an, die dir die Suche für diesen Treffer geliefert hat.",
        };
      }
      const seitencode = String(args.seitencode ?? "");
      const sektion = String(args.sektion ?? "").trim();
      const titel = String(args.titel ?? "").trim();
      if (!sektion || !titel) {
        return { error: "sektion und titel dürfen nicht leer sein." };
      }

      const fullText = await readNoteOrNull(ctx.vault, notePath);
      if (fullText === null) return { error: `Seite "${notePath}" nicht gefunden - evtl. verschoben oder gelöscht.` };
      state.manualPages.set(notePath, { notePath, seitencode, sektion, titel, fullText });
      return { notePath, seitencode, sektion, titel, fullText };
    }
    default:
      return { error: `Unbekanntes Werkzeug: ${fc.name}` };
  }
}
