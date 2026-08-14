import type { GroundingChunk } from "../gemini/types";
import type { PipelineStepHit, WebCitation } from "../retrieval/types";

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

interface CompactHitLike {
  seitencode: string;
  sektion: string;
  titel: string;
}

export function extractToolHits(response: Record<string, unknown>): PipelineStepHit[] | undefined {
  if (!Array.isArray(response.hits)) return undefined;
  return (response.hits as CompactHitLike[]).map((h) => ({
    seitencode: h.seitencode,
    sektion: h.sektion,
    titel: h.titel,
  }));
}

export function describeToolNarration(
  fc: { name: string; args: Record<string, unknown> },
  response: Record<string, unknown>
): string {
  if (typeof response.error === "string") {
    return `Fehler bei ${fc.name}: ${response.error}`;
  }
  switch (fc.name) {
    case "search_manual":
    case "search_manual_fuzzy": {
      const hits = Array.isArray(response.hits) ? (response.hits as CompactHitLike[]) : [];
      if (hits.length === 0) return "Keine Treffer im Handbuch gefunden.";
      const list = hits.map((h) => `${h.titel} [${h.seitencode || "Referenz"}]`).join(", ");
      return `${hits.length} Treffer gefunden: ${list}.`;
    }
    case "get_manual_page": {
      const seitencode = String(response.seitencode ?? "");
      const titel = String(response.titel ?? "");
      const fullText = typeof response.fullText === "string" ? response.fullText : "";
      return `Seite "${titel}"${seitencode ? ` [${seitencode}]` : ""} vollständig geladen (${fullText.length} Zeichen).`;
    }
    default:
      return `Werkzeug ${fc.name} ausgeführt.`;
  }
}

export function describeEmbedding(model: string, outputDim: number): string {
  return `Such-Embedding mit Modell "${model}" erzeugt (${outputDim} Dimensionen).`;
}

export function describeRetrieval(query: string, hitCount: number, usedFuzzy: boolean): string {
  const method = usedFuzzy
    ? "Hybrid-Suche (Volltext + Vektor), kombiniert mit tippfehlertoleranter Suche"
    : "Hybrid-Suche (Volltext + Vektor)";
  return `${method} nach "${query}": ${hitCount} Seite(n)/Abschnitt(e) gefunden.`;
}

export function describeRoundDecision(
  round: number,
  maxRounds: number,
  functionCalls: { name: string; args: Record<string, unknown> }[]
): string {
  if (functionCalls.length === 0) {
    return `Runde ${round}/${maxRounds}: Modell hat genug Informationen und antwortet direkt, ohne weitere Werkzeugaufrufe.`;
  }
  const names = functionCalls.map((fc) => fc.name).join(", ");
  return `Runde ${round}/${maxRounds}: Modell entscheidet sich für ${functionCalls.length} Werkzeugaufruf(e): ${names}.`;
}

export function describeClarification(question: string, batchedToolNames: string[]): string {
  if (batchedToolNames.length === 0) {
    return `Modell stellt eine Rückfrage: "${question}"`;
  }
  return `Modell stellt eine Rückfrage: "${question}" (zusätzlich in derselben Runde ausgeführt: ${batchedToolNames.join(", ")}).`;
}

export function describeBudgetExhausted(round: number, maxRounds: number): string {
  return `Werkzeug-Budget erreicht (${round}/${maxRounds} Runden) - erstelle abschließende Antwort ohne weitere Werkzeugaufrufe.`;
}

export function describeFinalAnswer(text: string, manualCitations: unknown[], webCitations: unknown[]): string {
  return `Antwort erstellt (${text.trim().length} Zeichen) mit ${manualCitations.length} Handbuch-Zitat(en) und ${webCitations.length} Web-Zitat(en).`;
}
