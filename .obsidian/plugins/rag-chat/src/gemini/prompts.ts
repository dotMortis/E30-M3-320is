import { FUNCTION_DECLARATIONS } from "../agent/tool-declarations";
import type { FunctionDeclaration } from "./types";

export const SYSTEM_PROMPT = `Du bist ein Experte für den BMW E30 M3 / 320is und assistierst bei Reparaturen.

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
2. **Zusätzliches Wissen (Allgemeinwissen & Web, nicht werksseitig verifiziert):** Ergänze die Antwort
   IMMER um zusätzlichen Kontext, praktische Hinweise und aktuelle Informationen (z.B. moderne
   Ersatzteile, gängige Foren-Hinweise, aktualisierte Teilenummern) aus deinem Allgemeinwissen und -
   falls verfügbar - aktuellen Web-Rechercheergebnissen, auch wenn Abschnitt 1 die Frage bereits
   beantwortet. Kennzeichne diese Angaben klar als nicht aus dem Werksmanual stammend. Weise bei
   sicherheitsrelevanten Werten (Drehmomente, Toleranzen, Materialspezifikationen) ausdrücklich darauf
   hin, dass die Werksangabe (falls in Abschnitt 1 vorhanden) Vorrang hat und ungeprüfte Werte nicht
   ohne Weiteres übernommen werden sollten.
3. Nenne bei Web-Quellen die URL bzw. Domain, damit sie nachvollziehbar sind.

Antworte auf Deutsch.`;

/**
 * Derived from `FUNCTION_DECLARATIONS` (the single source of truth for tool
 * name/parameters/description - see agent/tool-declarations.ts) so the
 * natural-language prompt suffix and the API's function-calling schema can't
 * drift apart. Formatted as "name(param1, param2): description" per tool.
 */
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
