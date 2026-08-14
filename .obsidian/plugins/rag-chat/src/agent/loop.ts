import { ABORT_ERROR_MESSAGE } from "../constants";
import { extractFinalAnswer } from "../gemini/answer-blocks";
import type { GenerateWithToolsResult, GeminiPart } from "../gemini/types";
import type { ChatTurn, ContextBlock } from "../retrieval/types";
import { appendClarificationAnswer, buildInitialState, cloneState } from "./conversation";
import { runForcedFinalRound } from "./final-round";
import { runModelRound } from "./round";
import { describeClarification, describeFinalAnswer } from "./status-text";
import { NOOP_STEP_REPORTER, type StepReporter } from "./step-reporter";
import { runToolCalls } from "./tool-round";
import { FUNCTION_DECLARATIONS } from "./tool-declarations";
import type { AgentLoopContext, AgentLoopState, AgentResult, PendingAgentState } from "./types";

function activeDeclarations(ctx: AgentLoopContext) {
  return ctx.settings.enableFuzzySearchLeg
    ? FUNCTION_DECLARATIONS
    : FUNCTION_DECLARATIONS.filter((d) => d.name !== "search_manual_fuzzy");
}

function finalAnswer(
  state: AgentLoopState,
  ctx: AgentLoopContext,
  result: GenerateWithToolsResult,
  reporter: StepReporter,
): AgentResult {
  const { text, shortAnswer } = extractFinalAnswer(result.parts.map((p) => p.text ?? "").join(""));
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
    shortAnswer,
    manualCitations,
    webCitations,
    webGroundingChunks: result.groundingChunks,
    webGroundingSupports: result.groundingSupports,
  };
}

function pauseForClarification(
  state: AgentLoopState,
  ctx: AgentLoopContext,
  askUserCall: NonNullable<GeminiPart["functionCall"]>,
  otherCalls: NonNullable<GeminiPart["functionCall"]>[],
  reporter: StepReporter,
): AgentResult {
  const question = String(askUserCall.args?.question ?? "Kannst du das bitte genauer beschreiben?");
  reporter.record({
    kind: "clarification",
    round: state.round,
    title: `Rückfrage an Nutzer: "${question}"`,
    narration: describeClarification(question, otherCalls.map((fc) => fc.name)),
  });
  const pendingCtx: AgentLoopContext = { ...ctx, settings: { ...ctx.settings } };
  return { status: "awaiting_clarification", question, pending: { state, ctx: pendingCtx } };
}

async function driveLoop(state: AgentLoopState, ctx: AgentLoopContext): Promise<AgentResult> {
  const maxRounds = ctx.settings.maxAgentRounds;
  const reporter = ctx.reporter ?? NOOP_STEP_REPORTER;
  const declarations = activeDeclarations(ctx);

  while (state.round < maxRounds) {
    if (ctx.signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);
    state.round++;
    ctx.onTextDelta?.("");

    const { result, functionCalls } = await runModelRound(state, ctx, declarations, maxRounds, reporter);

    if (functionCalls.length === 0) {
      return finalAnswer(state, ctx, result, reporter);
    }

    ctx.onTextDelta?.("");
    state.contents.push({ role: "model", parts: result.parts });

    const askUserCall = functionCalls.find((fc) => fc.name === "ask_user");
    const otherCalls = functionCalls.filter((fc) => fc !== askUserCall);

    const responseParts = await runToolCalls(otherCalls, ctx, state, reporter);
    if (responseParts.length > 0) {
      state.contents.push({ role: "user", parts: responseParts });
    }

    if (askUserCall) {
      return pauseForClarification(state, ctx, askUserCall, otherCalls, reporter);
    }
  }

  if (ctx.signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);
  return runForcedFinalRound(state, ctx, maxRounds, reporter);
}

export interface RunAgentLoopParams {
  question: string;
  history: ChatTurn[];
  baselineBlocks: ContextBlock[];
  ctx: AgentLoopContext;
}

export async function runAgentLoop(params: RunAgentLoopParams): Promise<AgentResult> {
  const { question, history, baselineBlocks, ctx } = params;
  const state = buildInitialState(question, history, baselineBlocks);
  return driveLoop(state, ctx);
}

export async function resumeAgentLoop(
  pending: PendingAgentState,
  userAnswer: string,
  signal?: AbortSignal,
): Promise<AgentResult> {
  const { state: pausedState, ctx: pausedCtx } = pending;
  const ctx: AgentLoopContext = signal ? { ...pausedCtx, signal } : pausedCtx;

  const askUserCallId = [...pausedState.contents]
    .reverse()
    .find((c) => c.role === "model")
    ?.parts.find((p) => p.functionCall?.name === "ask_user")?.functionCall?.id;

  const state = cloneState(pausedState);
  appendClarificationAnswer(state, userAnswer, askUserCallId);
  return driveLoop(state, ctx);
}
