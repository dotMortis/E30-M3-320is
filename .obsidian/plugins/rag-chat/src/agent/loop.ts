import { ABORT_ERROR_MESSAGE } from "../constants";
import { buildHistoryContents } from "../gemini/history";
import { generateWithTools } from "../gemini/client";
import type { GeminiContent, GeminiPart } from "../gemini/types";
import { buildContextXml, escapeXml } from "../retrieval/context-xml";
import type { ChatTurn, ContextBlock } from "../retrieval/types";
import { executeTool } from "./execute-tool";
import {
  describeCall,
  describeBudgetExhausted,
  describeClarification,
  describeFinalAnswer,
  describeRoundDecision,
  describeToolNarration,
  extractToolHits,
  mergeGrounding,
} from "./status-text";
import { NOOP_STEP_REPORTER } from "./step-reporter";
import { FUNCTION_DECLARATIONS } from "./tool-declarations";
import type { AgentLoopContext, AgentLoopState, AgentResult, PendingAgentState } from "./types";

async function driveLoop(state: AgentLoopState, ctx: AgentLoopContext): Promise<AgentResult> {
  const maxRounds = ctx.settings.maxAgentRounds;
  const reporter = ctx.reporter ?? NOOP_STEP_REPORTER;
  const declarations = ctx.settings.enableFuzzySearchLeg
    ? FUNCTION_DECLARATIONS
    : FUNCTION_DECLARATIONS.filter((d) => d.name !== "search_manual_fuzzy");

  while (state.round < maxRounds) {
    if (ctx.signal?.aborted) {
      throw new Error(ABORT_ERROR_MESSAGE);
    }
    state.round++;
    const roundStep = reporter.start({
      kind: "llm_round",
      round: state.round,
      title: `Runde ${state.round}/${maxRounds}: Modell denkt nach …`,
      model: ctx.settings.generationModel,
    });

    const result = await generateWithTools(state.contents, declarations, ctx.settings, {
      onStatus: (status) => reporter.update(roundStep, { title: status }),
      signal: ctx.signal,
    });
    mergeGrounding(state.webCitations, result.groundingChunks);

    const functionCalls = result.parts
      .filter((p): p is GeminiPart & { functionCall: NonNullable<GeminiPart["functionCall"]> } => Boolean(p.functionCall))
      .map((p) => p.functionCall);

    reporter.finish(roundStep, {
      title: `Runde ${state.round}/${maxRounds}: Modellantwort erhalten`,
      narration: describeRoundDecision(state.round, maxRounds, functionCalls),
    });

    if (functionCalls.length === 0) {
      const text = result.parts.map((p) => p.text ?? "").join("");
      const manualCitations = [...state.manualPages.values()];
      const webCitations = [...state.webCitations.values()];
      reporter.record({
        kind: "final_answer",
        round: state.round,
        title: "Antwort fertiggestellt",
        model: ctx.settings.generationModel,
        narration: describeFinalAnswer(text, manualCitations, webCitations),
      });
      return {
        status: "done",
        text,
        manualCitations,
        webCitations,
        webGroundingChunks: result.groundingChunks,
        webGroundingSupports: result.groundingSupports,
      };
    }

    state.contents.push({ role: "model", parts: result.parts });

    const askUserCall = functionCalls.find((fc) => fc.name === "ask_user");
    const otherCalls = functionCalls.filter((fc) => fc !== askUserCall);

    // Execute every non-ask_user call in this round (even if ask_user is
    // also present) so history never contains a functionCall left without a
    // matching functionResponse - the model already committed to all of
    // these calls in the same turn, and dropping some of them silently
    // would leave the conversation in an invalid state on resume.
    const responseParts: GeminiPart[] = [];
    for (const fc of otherCalls) {
      if (ctx.signal?.aborted) {
        throw new Error(ABORT_ERROR_MESSAGE);
      }
      const toolStep = reporter.start({
        kind: "tool_call",
        round: state.round,
        title: describeCall(fc),
        toolName: fc.name,
        toolArgs: fc.args,
        model: fc.name === "search_manual" ? ctx.settings.embeddingModel : undefined,
      });
      let response: Record<string, unknown>;
      try {
        response = await executeTool(fc, ctx, state, toolStep);
      } catch (err) {
        response = { error: err instanceof Error ? err.message : String(err) };
      }
      if (typeof response.error === "string") {
        reporter.fail(toolStep, response.error);
      } else {
        reporter.finish(toolStep, {
          toolResult: response,
          hits: extractToolHits(response),
          narration: describeToolNarration(fc, response),
        });
      }
      responseParts.push({ functionResponse: { ...(fc.id ? { id: fc.id } : {}), name: fc.name, response } });
    }
    if (responseParts.length > 0) {
      state.contents.push({ role: "user", parts: responseParts });
    }

    if (askUserCall) {
      const question = String(askUserCall.args?.question ?? "Kannst du das bitte genauer beschreiben?");
      reporter.record({
        kind: "clarification",
        round: state.round,
        title: `Rückfrage an Nutzer: "${question}"`,
        narration: describeClarification(question, otherCalls.map((fc) => fc.name)),
      });
      // Snapshot settings at the moment we pause: `ctx.settings` is normally
      // a live reference to the plugin's mutable settings object, which
      // could change while we're waiting on the user's answer (e.g. they
      // edit the API key or topK in the settings tab mid-clarification).
      // Freezing a shallow copy here means resumeAgentLoop continues with
      // the settings that were in effect when the question was asked.
      const pendingCtx: AgentLoopContext = { ...ctx, settings: { ...ctx.settings } };
      return { status: "awaiting_clarification", question, pending: { state, ctx: pendingCtx } };
    }
  }

  if (ctx.signal?.aborted) {
    throw new Error(ABORT_ERROR_MESSAGE);
  }
  reporter.record({
    kind: "budget_exhausted",
    round: state.round,
    title: "Werkzeug-Budget erreicht",
    narration: describeBudgetExhausted(state.round, maxRounds),
  });
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
  const finalStep = reporter.start({
    kind: "llm_round",
    round: state.round,
    title: "Erzwungene finale Antwort: Modell denkt nach …",
    model: ctx.settings.generationModel,
  });
  const final = await generateWithTools(state.contents, null, ctx.settings, {
    includeGoogleSearch: false,
    onStatus: (status) => reporter.update(finalStep, { title: status }),
    signal: ctx.signal,
  });
  mergeGrounding(state.webCitations, final.groundingChunks);
  const text = final.parts.map((p) => p.text ?? "").join("");
  const manualCitations = [...state.manualPages.values()];
  const webCitations = [...state.webCitations.values()];
  reporter.finish(finalStep, { title: "Erzwungene finale Antwort erhalten" });
  reporter.record({
    kind: "final_answer",
    round: state.round,
    title: "Antwort fertiggestellt",
    model: ctx.settings.generationModel,
    narration: describeFinalAnswer(text, manualCitations, webCitations),
  });
  return {
    status: "done",
    text,
    manualCitations,
    webCitations,
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
    { role: "user", parts: [{ text: `${contextXml}\n\n<question>\n${escapeXml(question)}\n</question>` }] },
  ];

  const state: AgentLoopState = { contents, round: 0, manualPages, webCitations: new Map() };
  return driveLoop(state, ctx);
}

export async function resumeAgentLoop(
  pending: PendingAgentState,
  userAnswer: string,
  signal?: AbortSignal
): Promise<AgentResult> {
  const { state: pausedState, ctx: pausedCtx } = pending;
  const ctx: AgentLoopContext = signal ? { ...pausedCtx, signal } : pausedCtx;
  const lastModelContent = [...pausedState.contents].reverse().find((c) => c.role === "model");
  const askUserCallId = lastModelContent?.parts.find((p) => p.functionCall?.name === "ask_user")?.functionCall?.id;

  const state: AgentLoopState = {
    contents: [...pausedState.contents],
    round: pausedState.round,
    manualPages: new Map(pausedState.manualPages),
    webCitations: new Map(pausedState.webCitations),
  };
  state.contents.push({
    role: "user",
    parts: [
      {
        functionResponse: {
          ...(askUserCallId ? { id: askUserCallId } : {}),
          name: "ask_user",
          response: { answer: userAnswer },
        },
      },
    ],
  });
  return driveLoop(state, ctx);
}
