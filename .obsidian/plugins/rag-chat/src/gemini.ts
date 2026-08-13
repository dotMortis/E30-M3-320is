import { requestUrlWithRetry } from "./http-retry";
import type { ChatTurn } from "./retriever";
import type { RagChatSettings } from "./settings";

/**
 * Pinned BASE system instruction (see PLAN.md Phase 4/6 "System prompt").
 * Steers determinism via the prompt since temperature/top_p/top_k are
 * deprecated on gemini-3.6-flash and are never sent.
 *
 * MUST stay byte-identical to .pipeline/rag/gen_client.py's SYSTEM_PROMPT
 * (that file is a dev/test-only client, not wired into the shipped plugin -
 * see its own comment - but the prompt itself is a shared invariant).
 *
 * Deliberately contains NO tool descriptions - see buildToolsSuffix below.
 * An earlier version of this prompt described the agent's tools by name
 * unconditionally, which caused Gemini to attempt a functionCall (and fail
 * with finishReason "MALFORMED_FUNCTION_CALL") on any call that didn't
 * actually have those tools declared in `tools[]` - e.g. the final
 * tools-stripped call in agent.ts's driveLoop, or this dev/test-only client,
 * which never declares tools at all. The tool list is now appended
 * dynamically (generateWithTools below) so it always matches exactly what
 * was actually declared for that specific call.
 *
 * Unlike the original "context-only, refuse otherwise" prompt, this version
 * deliberately allows - and asks for - extending manual-grounded answers
 * with the model's own general knowledge and live web results, as long as
 * the two are never blended together unlabeled.
 */
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
   <document seitencode="..."> deiner abgerufenen Quellen geliefert wurden.
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

/** Per-tool description lines, keyed by function name - appended to the
 * base SYSTEM_PROMPT (see buildToolsSuffix) only for tools actually present
 * in that call's declared `tools[]`, so the prompt never describes a tool
 * the model doesn't actually have access to this round. */
const TOOL_DESCRIPTIONS: Record<string, string> = {
  search_manual:
    "search_manual(query): durchsucht das Werkstatthandbuch (Hybrid-Suche: Volltext + Vektor) mit einer " +
    "von dir gewählten Suchanfrage und liefert eine kompakte Liste möglicher Seiten (Titel, Seitencode, " +
    "Sektion, notePath) - noch keinen vollen Seitentext.",
  search_manual_fuzzy:
    "search_manual_fuzzy(query): durchsucht das Handbuch tippfehler- und synonymtolerant. Nützlich bei " +
    "umgangssprachlichen Formulierungen oder wenn search_manual nichts Passendes liefert.",
  get_manual_page:
    "get_manual_page(notePath, seitencode, sektion, titel): liest eine bestimmte, bereits über eine der " +
    "Suchen gefundene Handbuchseite vollständig ein, wenn du mehr Details brauchst. Gib exakt die Werte " +
    "zurück, die dir die Suche für diesen Treffer geliefert hat.",
  ask_user:
    "ask_user(question): stellt dem Nutzer eine kurze Rückfrage, falls die Frage mehrdeutig ist oder eine " +
    "für die Antwort wichtige Information fehlt (z.B. Baujahr, Motorvariante, welches Bauteil genau). " +
    "Nutze dies sparsam - nur wenn eine Rückfrage die Antwort deutlich verbessern würde.",
};

const GOOGLE_SEARCH_DESCRIPTION =
  "google_search: durchsucht das Web nach aktuellen, öffentlich verfügbaren Informationen.";

/** Builds the tool-description suffix appended to SYSTEM_PROMPT for a given
 * call, based on exactly what's being declared in `tools[]` this round -
 * see SYSTEM_PROMPT's doc for why this must never drift from reality. */
function buildToolsSuffix(functionDeclarations: FunctionDeclaration[] | null, includeGoogleSearch: boolean): string {
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

/** One part of a Gemini `contents[]` entry. Only the union members this
 * plugin actually sends/receives are modeled (text, functionCall,
 * functionResponse) - see the Gemini API's Content/Part reference. */
export interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

/** A Gemini function declaration (OpenAPI-subset JSON schema for `parameters` -
 * see ai.google.dev/gemini-api/docs/function-calling). */
export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface GroundingChunk {
  uri: string;
  title: string;
}

/**
 * Maps a specific text span of THIS round's response (byte offsets into the
 * UTF-8 encoding of that response's text - see Google's GroundingSupport/
 * Segment reference) to one or more `groundingChunks` indices, e.g. "the
 * model's claim in [startIndex,endIndex) is attributed to chunks 0 and 2".
 * This is the official mechanism for building INLINE citations (as opposed
 * to a disconnected source list) - see citation-links.ts's
 * linkifyWebCitations, which is the sole consumer.
 *
 * `chunkIndices` deliberately index into the UNFILTERED `groundingChunks`
 * array returned alongside this (see generateWithTools's doc) - filtering
 * out empty-uri chunks before use would desync these indices.
 */
export interface GroundingSupport {
  startIndex: number;
  endIndex: number;
  chunkIndices: number[];
  /** The literal cited excerpt, if Google's API included one (sometimes
   * truncated with "…") - used only as a human-readable label/snippet
   * (e.g. in the bottom "Quellen (Web)" list), never for text matching. */
  text?: string;
}

export interface GenerateWithToolsResult {
  /** The model's response parts for this round - a mix of `text` and/or
   * `functionCall` parts (parallel function calls are possible). */
  parts: GeminiPart[];
  /** Web sources from Google Search grounding, if the google_search tool
   * fired during this round (see groundingMetadata.groundingChunks).
   * Intentionally NOT filtered (e.g. by empty uri) here - see
   * GroundingSupport's doc for why index-stability matters. */
  groundingChunks: GroundingChunk[];
  /** Inline citation spans for this round's response text (see
   * GroundingSupport's doc) - empty if the model didn't use google_search
   * this round, or Google returned no supports for it. */
  groundingSupports: GroundingSupport[];
  finishReason?: string;
}

/** Maps prior chat turns onto Gemini's `contents[]` shape (role "assistant"
 * -> "model", per the API's naming). Empty-text turns (e.g. an in-progress
 * assistant turn, or a turn that only asked a since-resolved clarifying
 * question) are dropped - the API rejects empty parts. Exported for
 * agent.ts, which seeds each new question's contents with prior turns for
 * real multi-turn memory (only each turn's final text is replayed, not its
 * retrieved <context> or intermediate tool calls, to keep token cost from
 * growing unboundedly across a long session). */
export function buildHistoryContents(history: ChatTurn[]): GeminiContent[] {
  return history
    .filter((t) => t.text.trim().length > 0)
    .map((t) => ({
      role: t.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: t.text }],
    }));
}

/**
 * Non-streaming generateContent call used by every round of the agent loop
 * (see agent.ts). Non-streaming is required here because each round needs
 * to inspect the response for `functionCall` parts before deciding whether
 * to continue the loop - Gemini's streaming wire format interleaves partial
 * text deltas that can't be cleanly inspected mid-stream for this purpose.
 * As a consequence, the final answer is revealed to the user in one shot
 * rather than token-by-token (same trade-off the old self-critique step
 * already made) - per-round status updates (see agent.ts's onStatus calls)
 * provide progress feedback instead.
 *
 * `includeGoogleSearch` defaults to true; agent.ts sets it to false for the
 * final forced-answer call once the tool-call round budget is exhausted, to
 * guarantee a plain-text response with no further tool round-trips.
 *
 * `onStatus`, if given, is forwarded to the retry wrapper (see http-retry.ts)
 * so a transient 429/5xx from Google shows a live "retrying …" label instead
 * of the round just looking stuck.
 */
export async function generateWithTools(
  contents: GeminiContent[],
  functionDeclarations: FunctionDeclaration[] | null,
  settings: RagChatSettings,
  opts?: { includeGoogleSearch?: boolean; onStatus?: (status: string) => void }
): Promise<GenerateWithToolsResult> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    throw new Error("Google API key is required - set it in RAG Chat settings.");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.generationModel}:generateContent`;

  const includeGoogleSearch = opts?.includeGoogleSearch !== false;
  const tools: Record<string, unknown>[] = [];
  if (includeGoogleSearch) {
    tools.push({ google_search: {} });
  }
  if (functionDeclarations && functionDeclarations.length > 0) {
    tools.push({ functionDeclarations });
  }

  // The tool-description suffix is built fresh for THIS call's actual
  // tools[] (see buildToolsSuffix's doc) - never a static/pinned string,
  // unlike the base SYSTEM_PROMPT above.
  const systemInstructionText = SYSTEM_PROMPT + buildToolsSuffix(functionDeclarations, includeGoogleSearch);

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: systemInstructionText }] },
    contents,
  };
  if (tools.length > 0) {
    body.tools = tools;
    // REQUIRED whenever google_search (built-in) and functionDeclarations
    // (custom) are both declared in tools[] - without this, gemini-3.6-flash
    // rejects the request outright with a 400: "Please enable
    // tool_config.include_server_side_tool_invocations to use Built-in
    // tools with Function calling." (verified live against the direct
    // Google generateContent endpoint, Aug 2026). Harmless to set even when
    // only one tool type is present - see Google's "tool combination" docs.
    // This is what every round of agent.ts's loop was missing, since every
    // round declares both google_search (includeGoogleSearch defaults true)
    // and the search_manual/get_manual_page/ask_user function declarations
    // together.
    body.toolConfig = { includeServerSideToolInvocations: true };
  }

  const response = await requestUrlWithRetry(
    {
      url,
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { onStatus: opts?.onStatus, label: "Generierung" }
  );

  const candidate = response.json?.candidates?.[0];
  const parts: GeminiPart[] = candidate?.content?.parts ?? [];
  if (parts.length === 0) {
    throw new Error(`Unexpected generateContent response shape: ${JSON.stringify(response.json).slice(0, 300)}`);
  }

  // Deliberately NOT filtered by empty uri here - groundingSupports below
  // references this array by raw index (groundingChunkIndices), so
  // filtering would desync the indices (see GroundingSupport's doc).
  // Empty-uri entries are simply skipped wherever a chunk is actually
  // resolved to a link (agent.ts's mergeGrounding, citation-links.ts).
  const rawChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const groundingChunks: GroundingChunk[] = rawChunks.map((c: Record<string, any>) => ({
    uri: c.web?.uri ?? "",
    title: c.web?.title ?? c.web?.uri ?? "",
  }));

  const rawSupports = candidate?.groundingMetadata?.groundingSupports ?? [];
  const groundingSupports: GroundingSupport[] = rawSupports
    .filter(
      (s: Record<string, any>) =>
        typeof s.segment?.endIndex === "number" && Array.isArray(s.groundingChunkIndices) && s.groundingChunkIndices.length > 0
    )
    .map((s: Record<string, any>) => ({
      startIndex: typeof s.segment?.startIndex === "number" ? s.segment.startIndex : 0,
      endIndex: s.segment.endIndex,
      chunkIndices: s.groundingChunkIndices,
      text: typeof s.segment?.text === "string" ? s.segment.text : undefined,
    }));

  return { parts, groundingChunks, groundingSupports, finishReason: candidate?.finishReason };
}
