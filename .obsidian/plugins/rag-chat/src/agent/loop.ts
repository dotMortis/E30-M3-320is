import { buildHistoryContents } from "../gemini/history";
import { generateWithTools } from "../gemini/client";
import type { GeminiContent, GeminiPart } from "../gemini/types";
import { buildContextXml } from "../retrieval/context-xml";
import type { ChatTurn, ContextBlock } from "../retrieval/types";
import { executeTool } from "./execute-tool";
import { describeCall, describeResult, mergeGrounding } from "./status-text";
import { FUNCTION_DECLARATIONS } from "./tool-declarations";
import type { AgentLoopContext, AgentLoopState, AgentResult, PendingAgentState } from "./types";

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

export async function resumeAgentLoop(pending: PendingAgentState, userAnswer: string): Promise<AgentResult> {
  const { state, ctx } = pending;
  state.contents.push({
    role: "user",
    parts: [{ functionResponse: { name: "ask_user", response: { answer: userAnswer } } }],
  });
  return driveLoop(state, ctx);
}
