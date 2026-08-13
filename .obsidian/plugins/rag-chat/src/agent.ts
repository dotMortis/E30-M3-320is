import type { Vault } from "obsidian";
import {
  buildHistoryContents,
  generateWithTools,
  type FunctionDeclaration,
  type GeminiContent,
  type GeminiPart,
  type GroundingChunk,
  type GroundingSupport,
} from "./gemini";
import {
  buildContextXml,
  embedQuery,
  federatedHybridSearch,
  toCompactHits,
  type CachedIndices,
  type ChatTurn,
  type ContextBlock,
  type FuzzySearchApi,
  type WebCitation,
} from "./retriever";
import type { RagChatSettings } from "./settings";

/**
 * agent.ts — the bounded agentic tool-use loop that replaced the old
 * deterministic "widen similarity / LLM query rewrite / self-critique" retry
 * stack (see workflow.ts's history for that removed logic). Instead of a
 * fixed sequence of hidden retries, the model itself is handed a small set
 * of tools and drives its own research loop, up to a hard round cap
 * (settings.maxAgentRounds) - see the tool table in gemini.ts's
 * SYSTEM_PROMPT for what each tool does and when the model should use it.
 *
 * Loop shape per round:
 *   1. Call Gemini (generateWithTools) with the running `contents[]` and the
 *      tool declarations.
 *   2. If the response has no functionCall parts, it's the final answer -
 *      return it (status "done").
 *   3. If one of the functionCalls is ask_user, PAUSE here: return status
 *      "awaiting_clarification" with a PendingAgentState capturing the
 *      exact contents/round/citation state so far. The caller (view.ts)
 *      shows the question and, on your next reply, calls resumeAgentLoop()
 *      to continue the SAME loop (not a fresh, independent turn) - the
 *      resumed round still counts against the original round budget.
 *   4. Otherwise, execute every requested tool call locally, append a
 *      functionResponse for each, and loop.
 *   5. If the round cap is hit while the model still wants to call tools,
 *      force one final tools-stripped call and return whatever text comes
 *      back (status "done") - see driveLoop's post-loop fallback.
 */

const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
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

export interface AgentLoopContext {
  settings: RagChatSettings;
  vault: Vault;
  indices: CachedIndices;
  fuzzyApi: FuzzySearchApi | null;
  /** Called with a short, live progress label per round (e.g. "Runde 2/4:
   * durchsuche Handbuch nach '...'") - purely for UI feedback. */
  onStatus?: (status: string) => void;
}

interface AgentLoopState {
  contents: GeminiContent[];
  round: number;
  /** Every manual page the model has fully seen (initial baseline retrieval
   * + any get_manual_page calls), returned as citations regardless of
   * whether the final answer text explicitly quotes each one - mirrors the
   * old workflow's "citations = all context blocks passed in" behavior. */
  manualPages: Map<string, ContextBlock>;
  webCitations: Map<string, WebCitation>;
}

/** Opaque (to callers) resumable state for a paused ask_user turn. Lives
 * only in memory for the duration of the Obsidian session (see view.ts) -
 * not serialized to disk, so a plugin reload/app restart mid-clarification
 * loses it (the user would just get a fresh turn instead of a resume). */
export interface PendingAgentState {
  state: AgentLoopState;
  ctx: AgentLoopContext;
}

export interface AgentDone {
  status: "done";
  text: string;
  manualCitations: ContextBlock[];
  /** Deduped, across-all-rounds web sources (see mergeGrounding) - the
   * fallback/complete "Quellen (Web)" list (view.ts). */
  webCitations: WebCitation[];
  /** Index-preserving grounding chunks + text-span supports from ONLY the
   * exact round that produced `text` above (not accumulated across rounds
   * like webCitations) - byte offsets in a support are only meaningful
   * against the specific response text they came from, so mixing rounds
   * here would misplace inline citations (see citation-links.ts's
   * linkifyWebCitations, the sole consumer). */
  webGroundingChunks: GroundingChunk[];
  webGroundingSupports: GroundingSupport[];
}

export interface AgentAwaitingClarification {
  status: "awaiting_clarification";
  question: string;
  pending: PendingAgentState;
}

export type AgentResult = AgentDone | AgentAwaitingClarification;

function mergeGrounding(map: Map<string, WebCitation>, chunks: GroundingChunk[]): void {
  for (const c of chunks) {
    if (c.uri) map.set(c.uri, c);
  }
}

function describeCall(fc: { name: string; args: Record<string, unknown> }): string {
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

/** Follow-up status line emitted right after a tool actually ran, describing
 * its OUTCOME (hit count, error, page loaded) rather than just the fact it
 * was called - this is what actually explains, in the "Rechercheverlauf"
 * log (see view.ts), why the agent loop needed another round (e.g. "0
 * Treffer" made it obvious the model had to rephrase and try again). */
function describeResult(fc: { name: string; args: Record<string, unknown> }, response: Record<string, unknown>): string {
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

async function executeTool(
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
      const file = ctx.vault.getFileByPath(notePath);
      if (!file) return { error: `Seite "${notePath}" nicht gefunden - evtl. verschoben oder gelöscht.` };
      const fullText = await ctx.vault.read(file);
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

/** Drives the round loop starting from `state` (either freshly seeded by
 * runAgentLoop, or resumed by resumeAgentLoop after a clarifying answer). */
async function driveLoop(state: AgentLoopState, ctx: AgentLoopContext): Promise<AgentResult> {
  const maxRounds = ctx.settings.maxAgentRounds;
  const declarations = ctx.settings.enableFuzzySearchLeg
    ? FUNCTION_DECLARATIONS
    : FUNCTION_DECLARATIONS.filter((d) => d.name !== "search_manual_fuzzy");

  while (state.round < maxRounds) {
    state.round++;
    ctx.onStatus?.(`Runde ${state.round}/${maxRounds}: denke nach …`);

    const result = await generateWithTools(state.contents, declarations, ctx.settings, { onStatus: ctx.onStatus });
    mergeGrounding(state.webCitations, result.groundingChunks);

    const functionCalls = result.parts
      .filter((p): p is GeminiPart & { functionCall: NonNullable<GeminiPart["functionCall"]> } => Boolean(p.functionCall))
      .map((p) => p.functionCall);

    if (functionCalls.length === 0) {
      const text = result.parts.map((p) => p.text ?? "").join("");
      return {
        status: "done",
        text,
        manualCitations: [...state.manualPages.values()],
        webCitations: [...state.webCitations.values()],
        webGroundingChunks: result.groundingChunks,
        webGroundingSupports: result.groundingSupports,
      };
    }

    state.contents.push({ role: "model", parts: result.parts });

    const askUserCall = functionCalls.find((fc) => fc.name === "ask_user");
    if (askUserCall) {
      const question = String(askUserCall.args?.question ?? "Kannst du das bitte genauer beschreiben?");
      return { status: "awaiting_clarification", question, pending: { state, ctx } };
    }

    const responseParts: GeminiPart[] = [];
    for (const fc of functionCalls) {
      ctx.onStatus?.(`Runde ${state.round}/${maxRounds}: ${describeCall(fc)} …`);
      const response = await executeTool(fc, ctx, state);
      ctx.onStatus?.(`Runde ${state.round}/${maxRounds}: ${describeResult(fc, response)}`);
      responseParts.push({ functionResponse: { name: fc.name, response } });
    }
    state.contents.push({ role: "user", parts: responseParts });
  }

  // Hard cap hit while the model still wanted to call tools - force a final,
  // tools-stripped answer with whatever's been gathered so far.
  ctx.onStatus?.("Werkzeug-Budget erreicht - erstelle abschließende Antwort …");
  state.contents.push({
    role: "user",
    parts: [
      {
        text:
          "Das Werkzeug-Budget für diese Frage ist aufgebraucht. Antworte jetzt direkt und vollständig " +
          "mit den bisher verfügbaren Informationen, ohne weitere Werkzeugaufrufe.",
      },
    ],
  });
  const final = await generateWithTools(state.contents, null, ctx.settings, {
    includeGoogleSearch: false,
    onStatus: ctx.onStatus,
  });
  mergeGrounding(state.webCitations, final.groundingChunks);
  const text = final.parts.map((p) => p.text ?? "").join("");
  return {
    status: "done",
    text,
    manualCitations: [...state.manualPages.values()],
    webCitations: [...state.webCitations.values()],
    webGroundingChunks: final.groundingChunks,
    webGroundingSupports: final.groundingSupports,
  };
}

export interface RunAgentLoopParams {
  question: string;
  history: ChatTurn[];
  /** Free, no-extra-LLM-call baseline retrieval (hybrid search + parent-note
   * expansion), run once by workflow.ts before handing off here - seeds the
   * initial <context> so the common case doesn't need any tool round-trips
   * at all. */
  baselineBlocks: ContextBlock[];
  ctx: AgentLoopContext;
}

export async function runAgentLoop(params: RunAgentLoopParams): Promise<AgentResult> {
  const { question, history, baselineBlocks, ctx } = params;

  const manualPages = new Map<string, ContextBlock>();
  for (const b of baselineBlocks) manualPages.set(b.notePath, b);

  const contextXml = buildContextXml(baselineBlocks);
  const contents: GeminiContent[] = [
    ...buildHistoryContents(history),
    { role: "user", parts: [{ text: `${contextXml}\n\n<question>\n${question}\n</question>` }] },
  ];

  const state: AgentLoopState = { contents, round: 0, manualPages, webCitations: new Map() };
  return driveLoop(state, ctx);
}

/** Resumes a paused ask_user loop with the user's reply, feeding it back as
 * that function call's response and continuing the SAME round budget (a
 * clarifying round still counts against maxAgentRounds - see
 * PendingAgentState's doc). */
export async function resumeAgentLoop(pending: PendingAgentState, userAnswer: string): Promise<AgentResult> {
  const { state, ctx } = pending;
  state.contents.push({
    role: "user",
    parts: [{ functionResponse: { name: "ask_user", response: { answer: userAnswer } } }],
  });
  return driveLoop(state, ctx);
}
