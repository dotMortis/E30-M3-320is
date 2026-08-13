import type { GroundingChunk } from "../gemini/types";
import type { WebCitation } from "../retrieval/types";

export function mergeGrounding(map: Map<string, WebCitation>, chunks: GroundingChunk[]): void {
  for (const c of chunks) {
    if (c.uri) map.set(c.uri, c);
  }
}

export function describeCall(fc: { name: string; args: Record<string, unknown> }): string {
  switch (fc.name) {
    case "search_manual":
      return `durchsuche Handbuch nach "${String(fc.args?.query ?? "")}"`;
    case "search_manual_fuzzy":
      return `durchsuche Handbuch (tippfehlertolerant) nach "${String(fc.args?.query ?? "")}"`;
    case "get_manual_page":
      return `hole Seite ${String(fc.args?.seitencode ?? fc.args?.notePath ?? "")}`;
    default:
      return `führe ${fc.name} aus`;
  }
}

export function describeResult(fc: { name: string; args: Record<string, unknown> }, response: Record<string, unknown>): string {
  if (typeof response.error === "string") return `Fehler: ${response.error}`;
  switch (fc.name) {
    case "search_manual":
    case "search_manual_fuzzy": {
      const hits = Array.isArray(response.hits) ? response.hits.length : 0;
      return `${hits} Treffer`;
    }
    case "get_manual_page":
      return `Seite geladen (${String(response.seitencode ?? response.notePath ?? "")})`;
    default:
      return "erledigt";
  }
}
