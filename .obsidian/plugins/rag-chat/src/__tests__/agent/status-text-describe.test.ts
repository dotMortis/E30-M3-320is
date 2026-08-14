import { describe, expect, it } from "vitest";
import {
  describeBudgetExhausted,
  describeCall,
  describeClarification,
  describeEmbedding,
  describeFinalAnswer,
  describeRetrieval,
  describeRoundDecision,
  describeToolNarration,
  extractToolHits,
  mergeGrounding,
} from "../../agent/status-text";
import type { GroundingChunk } from "../../gemini/types";
import type { WebCitation } from "../../retrieval/types";
describe("extractToolHits", () => {
  it("maps the response's hits to the compact PipelineStepHit shape", () => {
    const hits = [{ notePath: "16-01.md", seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank" }];
    expect(extractToolHits({ hits })).toEqual([{ seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank" }]);
  });

  it("returns undefined when there is no hits array", () => {
    expect(extractToolHits({})).toBeUndefined();
  });
});

describe("describeEmbedding", () => {
  it("mentions the model and output dimensions", () => {
    expect(describeEmbedding("gemini-embedding-2", 3072)).toBe(
      'Such-Embedding mit Modell "gemini-embedding-2" erzeugt (3072 Dimensionen).'
    );
  });
});

describe("describeRetrieval", () => {
  it("mentions hybrid search alone when fuzzy wasn't used", () => {
    expect(describeRetrieval("Bremse", 5, false)).toBe(
      'Hybrid-Suche (Volltext + Vektor) nach "Bremse": 5 Seite(n)/Abschnitt(e) gefunden.'
    );
  });

  it("mentions the fuzzy leg when it was merged in", () => {
    expect(describeRetrieval("Bremse", 5, true)).toContain("tippfehlertoleranter Suche");
  });
});

describe("describeRoundDecision", () => {
  it("describes answering directly when there are no function calls", () => {
    expect(describeRoundDecision(1, 4, [])).toBe(
      "Runde 1/4: Modell hat genug Informationen und antwortet direkt, ohne weitere Werkzeugaufrufe."
    );
  });

  it("lists the chosen tool names", () => {
    expect(describeRoundDecision(2, 4, [{ name: "search_manual", args: {} }, { name: "ask_user", args: {} }])).toBe(
      "Runde 2/4: Modell entscheidet sich für 2 Werkzeugaufruf(e): search_manual, ask_user."
    );
  });
});

describe("describeClarification", () => {
  it("mentions only the question when nothing else ran in the same round", () => {
    expect(describeClarification("Welches Baujahr?", [])).toBe('Modell stellt eine Rückfrage: "Welches Baujahr?"');
  });

  it("mentions batched tool calls executed alongside the clarification", () => {
    expect(describeClarification("Welches Baujahr?", ["search_manual"])).toBe(
      'Modell stellt eine Rückfrage: "Welches Baujahr?" (zusätzlich in derselben Runde ausgeführt: search_manual).'
    );
  });
});

describe("describeBudgetExhausted", () => {
  it("mentions the round count and total", () => {
    expect(describeBudgetExhausted(4, 4)).toBe(
      "Werkzeug-Budget erreicht (4/4 Runden) - erstelle abschließende Antwort ohne weitere Werkzeugaufrufe."
    );
  });
});

describe("describeFinalAnswer", () => {
  it("reports text length and citation counts", () => {
    expect(describeFinalAnswer("Antwort", [{}], [])).toBe(
      "Antwort erstellt (7 Zeichen) mit 1 Handbuch-Zitat(en) und 0 Web-Zitat(en)."
    );
  });
});
