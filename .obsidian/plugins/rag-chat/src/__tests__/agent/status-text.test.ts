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

describe("mergeGrounding", () => {
  it("adds chunks with a non-empty uri into the map, keyed by uri", () => {
    const map = new Map<string, WebCitation>();
    mergeGrounding(map, [{ uri: "https://a.com", title: "A" }]);
    expect(map.get("https://a.com")).toEqual({ uri: "https://a.com", title: "A" });
  });

  it("skips chunks with an empty uri", () => {
    const map = new Map<string, WebCitation>();
    mergeGrounding(map, [{ uri: "", title: "Empty" }]);
    expect(map.size).toBe(0);
  });

  it("overwrites an existing entry for the same uri (last write wins)", () => {
    const map = new Map<string, WebCitation>();
    mergeGrounding(map, [{ uri: "https://a.com", title: "First" }]);
    mergeGrounding(map, [{ uri: "https://a.com", title: "Second" }]);
    expect(map.get("https://a.com")?.title).toBe("Second");
  });

  it("accumulates chunks across multiple calls (used across agent-loop rounds)", () => {
    const map = new Map<string, WebCitation>();
    mergeGrounding(map, [{ uri: "https://a.com", title: "A" }]);
    mergeGrounding(map, [{ uri: "https://b.com", title: "B" }]);
    expect(map.size).toBe(2);
  });

  it("does nothing for an empty chunks array", () => {
    const map = new Map<string, WebCitation>();
    mergeGrounding(map, []);
    expect(map.size).toBe(0);
  });
});

describe("describeCall", () => {
  it("describes search_manual with its query", () => {
    expect(describeCall({ name: "search_manual", args: { query: "Bremse" } })).toBe('durchsuche Handbuch nach "Bremse"');
  });

  it("describes search_manual_fuzzy with its query", () => {
    expect(describeCall({ name: "search_manual_fuzzy", args: { query: "Bremse" } })).toBe(
      'durchsuche Handbuch (tippfehlertolerant) nach "Bremse"'
    );
  });

  it("describes get_manual_page preferring seitencode over notePath", () => {
    expect(describeCall({ name: "get_manual_page", args: { seitencode: "16-01", notePath: "16-01.md" } })).toBe(
      "hole Seite 16-01"
    );
  });

  it("describes get_manual_page falling back to notePath when seitencode is missing", () => {
    expect(describeCall({ name: "get_manual_page", args: { notePath: "16-01.md" } })).toBe("hole Seite 16-01.md");
  });

  it("falls back to a generic description for an unknown tool name", () => {
    expect(describeCall({ name: "unknown_tool", args: {} })).toBe("führe unknown_tool aus");
  });

  it("handles a missing query gracefully for search_manual", () => {
    expect(describeCall({ name: "search_manual", args: {} })).toBe('durchsuche Handbuch nach ""');
  });
});

describe("describeToolNarration", () => {
  it("reports the error message when the response has an error field", () => {
    expect(describeToolNarration({ name: "search_manual", args: {} }, { error: "query darf nicht leer sein." })).toBe(
      "Fehler bei search_manual: query darf nicht leer sein."
    );
  });

  it("lists the hits for search_manual", () => {
    const hits = [{ seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank" }];
    expect(describeToolNarration({ name: "search_manual", args: {} }, { hits })).toBe(
      "1 Treffer gefunden: Tank [16-01]."
    );
  });

  it("reports no hits for search_manual_fuzzy", () => {
    expect(describeToolNarration({ name: "search_manual_fuzzy", args: {} }, { hits: [] })).toBe(
      "Keine Treffer im Handbuch gefunden."
    );
  });

  it("treats a non-array hits field as no hits", () => {
    expect(describeToolNarration({ name: "search_manual", args: {} }, {})).toBe("Keine Treffer im Handbuch gefunden.");
  });

  it("reports the loaded page for get_manual_page including character count", () => {
    expect(
      describeToolNarration(
        { name: "get_manual_page", args: {} },
        { seitencode: "16-01", titel: "Tank", fullText: "abcde" }
      )
    ).toBe('Seite "Tank" [16-01] vollständig geladen (5 Zeichen).');
  });

  it("omits the seitencode bracket for a reference doc with no seitencode", () => {
    expect(
      describeToolNarration({ name: "get_manual_page", args: {} }, { seitencode: "", titel: "Glossar", fullText: "abc" })
    ).toBe('Seite "Glossar" vollständig geladen (3 Zeichen).');
  });

  it("returns a generic description for an unknown tool name", () => {
    expect(describeToolNarration({ name: "unknown_tool", args: {} }, {})).toBe("Werkzeug unknown_tool ausgeführt.");
  });
});

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
