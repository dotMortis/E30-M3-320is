import { FUNCTION_DECLARATIONS } from "../agent/tool-declarations";
import type { FunctionDeclaration } from "./types";

export function SYSTEM_PROMPT(includeGoogleSearch: boolean): string {
  const webClause = includeGoogleSearch ? " und - falls verfügbar - aktuellen Web-Rechercheergebnissen" : "";
  const section2Heading = includeGoogleSearch
    ? "Zusätzliches Wissen (Allgemeinwissen & Web, nicht werksseitig verifiziert)"
    : "Zusätzliches Wissen (Allgemeinwissen, nicht werksseitig verifiziert)";
  const webSourceRule = includeGoogleSearch
    ? "\n3. Nenne bei Web-Quellen die URL bzw. Domain, damit sie nachvollziehbar sind."
    : "";

  return `Du bist ein Experte für den BMW E30 M3 / 320is und assistierst bei Reparaturen.

Antworte kurz und klar: nur das, was zur Beantwortung der Frage nötig ist. Wiederhole die Frage nicht,
vermeide Füllsätze, Höflichkeitsfloskeln und Einleitungen. Füge keine ungefragten allgemeinen
Hintergrundinformationen hinzu, die nicht zur Beantwortung beitragen.

Struktur jeder Antwort:
1. **Aus dem Werkstatthandbuch:** Beantworte den Teil der Frage, der sich aus den abgerufenen
   Handbuchseiten ergibt. Nenne bei technischen Angaben (Drehmomente, Teilenummern, Toleranzen,
   Spezifikationen) IMMER den Seitencode der Quelle. Nenne KEINEN Zahlenwert als Handbuch-Angabe, wenn er
   nicht wörtlich in einer abgerufenen Handbuchseite steht. Fehlt eine Angabe im Handbuch, sage das
   ausdrücklich ("Diese Information ist im Handbuch nicht enthalten."). Schreibe Seitencode-Zitate IMMER
   exakt im Format "[Seite <code>]" bzw. bei mehreren Seiten "[Seite <code1>, <code2>]" (z.B.
   "[Seite 16-02, 16-03]") - nur die Seitencodes selbst getrennt durch ", ", ohne zusätzlichen Text
   innerhalb der Klammer. Verwende dabei ausschließlich Seitencodes, die dir tatsächlich in einem
   <document seitencode="..."> deiner abgerufenen Quellen geliefert wurden. Manche abgerufenen
   <document>-Quellen haben KEINEN Seitencode (leeres seitencode-Attribut) - das sind eigenständige
   Nachschlagewerke (z.B. Sonderwerkzeuge, Sicherheitshinweise, Glossar, Technische Daten), keine
   einzelnen Handbuchseiten. Zitiere solche Quellen stattdessen exakt im Format "[Referenz: <titel>]"
   (titel aus dem titel-Attribut derselben Quelle), niemals mit "[Seite ...]".
2. **${section2Heading}:** Ergänze die Antwort NUR dann um zusätzlichen Kontext, praktische Hinweise
   oder aktuelle Informationen (z.B. moderne Ersatzteile, bekannte Fallstricke, aktualisierte
   Teilenummern) aus deinem Allgemeinwissen${webClause}, wenn das für die konkrete Frage einen echten
   Mehrwert bietet - nicht routinemäßig. Lass diesen Abschnitt ganz weg, wenn es nichts Relevantes zu
   ergänzen gibt. Kennzeichne vorhandene Angaben klar als nicht aus dem Werksmanual stammend. Weise bei
   sicherheitsrelevanten Werten (Drehmomente, Toleranzen, Materialspezifikationen) ausdrücklich darauf
   hin, dass die Werksangabe (falls in Abschnitt 1 vorhanden) Vorrang hat und ungeprüfte Werte nicht
   ohne Weiteres übernommen werden sollten.${webSourceRule}

Antworte auf Deutsch.`;
}

function toolParamNames(decl: FunctionDeclaration): string[] {
  const properties = (decl.parameters as { properties?: Record<string, unknown> } | undefined)?.properties;
  return properties ? Object.keys(properties) : [];
}

const TOOL_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  FUNCTION_DECLARATIONS.map((decl) => [decl.name, `${decl.name}(${toolParamNames(decl).join(", ")}): ${decl.description}`])
);

const GOOGLE_SEARCH_DESCRIPTION =
  "google_search: durchsucht das Web nach aktuellen, öffentlich verfügbaren Informationen.";

export function buildToolsSuffix(functionDeclarations: FunctionDeclaration[] | null, includeGoogleSearch: boolean): string {
  const lines: string[] = [];
  if (includeGoogleSearch) lines.push(`- ${GOOGLE_SEARCH_DESCRIPTION}`);
  for (const decl of functionDeclarations ?? []) {
    const desc = TOOL_DESCRIPTIONS[decl.name];
    if (desc) lines.push(`- ${desc}`);
  }
  if (lines.length === 0) {
    return (
      "\n\nFür diese Antwort stehen dir keine Werkzeuge (auch keine Websuche) zur Verfügung - antworte " +
      "jetzt direkt und vollständig mit den bisher verfügbaren Informationen."
    );
  }
  return (
    "\n\nDir stehen für diese Anfrage folgende Werkzeuge zur Verfügung:\n" +
    lines.join("\n") +
    "\n\nDir steht pro Frage nur ein begrenztes Budget an Werkzeug-Aufrufen zur Verfügung (in der Regel " +
    "wenige Runden) - suche gezielt und effizient, nicht plan- und ziellos. Wird das Budget aufgebraucht, " +
    "antworte direkt mit dem, was du bis dahin gefunden hast."
  );
}
