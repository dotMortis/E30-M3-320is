import { splitAnswerBlocks } from "../gemini/answer-blocks";
import { generateWithToolsStreaming } from "../gemini/generate-stream";
import type { FunctionDeclaration, GeminiPart } from "../gemini/types";
import { describeRoundDecision, mergeGrounding } from "./status-text";
import type { StepReporter } from "./step-reporter";
import type { AgentLoopContext, AgentLoopState } from "./types";

type FunctionCall = NonNullable<GeminiPart["functionCall"]>;

export async function runModelRound(
  state: AgentLoopState,
  ctx: AgentLoopContext,
  declarations: FunctionDeclaration[],
  maxRounds: number,
  reporter: StepReporter,
) {
  const roundStep = reporter.start({
    kind: "llm_round",
    round: state.round,
    title: `Runde ${state.round}/${maxRounds}: Modell denkt nach …`,
    model: ctx.settings.generationModel,
  });

  let roundText = "";
  let shortAnswerSent = false;
  const result = await generateWithToolsStreaming(state.contents, declarations, ctx.settings, {
    includeGoogleSearch: ctx.settings.webSearchEnabled,
    thinkingEnabled: ctx.settings.thinkingEnabled,
    ttsRequested: ctx.settings.ttsEnabled,
    onDelta: (chunk) => {
      roundText += chunk;
      const blocks = splitAnswerBlocks(roundText);
      if (blocks.shortAnswerComplete && !shortAnswerSent) {
        shortAnswerSent = true;
        ctx.onShortAnswerReady?.(blocks.shortAnswer ?? "");
      }
      ctx.onTextDelta?.(blocks.answer);
    },
    onStatus: (status) => reporter.update(roundStep, { title: status }),
    signal: ctx.signal,
  });
  mergeGrounding(state.webCitations, result.groundingChunks);

  const functionCalls = result.parts
    .filter((p): p is GeminiPart & { functionCall: FunctionCall } => Boolean(p.functionCall))
    .map((p) => p.functionCall);

  reporter.finish(roundStep, {
    title: `Runde ${state.round}/${maxRounds}: Modellantwort erhalten`,
    narration: describeRoundDecision(state.round, maxRounds, functionCalls),
  });

  return { result, functionCalls };
}
