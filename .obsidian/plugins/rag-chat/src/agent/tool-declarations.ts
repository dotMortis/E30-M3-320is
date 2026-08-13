import type { FunctionDeclaration } from "../gemini/types";

export const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "search_manual",
    description:
      "Durchsucht das Werkstatthandbuch (Hybrid: Volltext + Vektor) mit einer selbst gewählten " +
      "Suchanfrage. Liefert eine kompakte Trefferliste (Titel, Seitencode, Sektion, notePath) - noch " +
      "keinen vollen Seitentext. Nutze dies, wenn die bisher abgerufenen Handbuchseiten die Frage nicht " +
      "abdecken oder du gezielt nach einem anderen Begriff/Bauteil suchen willst.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Die Suchanfrage, idealerweise mit Werkstatt-Fachbegriffen." },
      },
      required: ["query"],
    },
  },
  {
    name: "search_manual_fuzzy",
    description:
      "Durchsucht das Handbuch tippfehler- und synonymtolerant (Vault Search). Nützlich bei " +
      "umgangssprachlichen Formulierungen oder wenn search_manual nichts Passendes liefert.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Die Suchanfrage." },
      },
      required: ["query"],
    },
  },
  {
    name: "get_manual_page",
    description:
      "Liest eine bestimmte, über search_manual oder search_manual_fuzzy bereits gefundene " +
      "Handbuchseite vollständig ein. Gib exakt die notePath/seitencode/sektion/titel-Werte an, die dir " +
      "die Suche für diesen Treffer geliefert hat.",
    parameters: {
      type: "object",
      properties: {
        notePath: { type: "string" },
        seitencode: { type: "string" },
        sektion: { type: "string" },
        titel: { type: "string" },
      },
      required: ["notePath", "seitencode", "sektion", "titel"],
    },
  },
  {
    name: "ask_user",
    description:
      "Stellt dem Nutzer eine kurze Rückfrage, falls die Frage mehrdeutig ist oder eine wichtige " +
      "Information fehlt. Sparsam einsetzen - nur wenn es die Antwort deutlich verbessert. Beendet diese " +
      "Werkzeug-Runde; die Antwort des Nutzers wird dir danach als Ergebnis dieses Aufrufs zurückgegeben.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string", description: "Die Rückfrage an den Nutzer, auf Deutsch." },
      },
      required: ["question"],
    },
  },
];
