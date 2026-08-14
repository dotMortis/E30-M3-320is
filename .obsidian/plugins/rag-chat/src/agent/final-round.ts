import { generateWithToolsStreaming } from "../gemini/generate-stream";
import { describeBudgetExhausted, describeFinalAnswer, mergeGrounding } from "./status-text";
import type { StepReporter } from "./step-reporter";
import type { AgentLoopContext, AgentLoopState, AgentResult } from "./types";

const BUDGET_EXHAUSTED_PROMPT =
  "Das Werkzeug-Budget für diese Frage ist aufgebraucht. Antworte jetzt direkt und vollständig " +
  "mit den bisher verfügbaren Informationen, ohne weitere Werkzeugaufrufe.";

export async function runForcedFinalRound(
  state: AgentLoopState,
  ctx: AgentLoopContext,
  maxRounds: number,
  reporter: StepReporter,
): Promise<AgentResult> {
  reporter.record({
    kind: "budget_exhausted",
    round: state.round,
    title: "Werkzeug-Budget erreicht",
    narration: describeBudgetExhausted(state.round, maxRounds),
  });
  state.contents.push({ role: "user", parts: [{ text: BUDGET_EXHAUSTED_PROMPT }] });
  ctx.onTextDelta?.("");

  const finalStep = reporter.start({
    kind: "llm_round",
    round: state.round,
    title: "Erzwungene finale Antwort: Modell denkt nach …",
    model: ctx.settings.generationModel,
  });

  let finalRoundText = "";
  const final = await generateWithToolsStreaming(state.contents, null, ctx.settings, {
    includeGoogleSearch: false,
    thinkingEnabled: ctx.settings.thinkingEnabled,
    onDelta: (chunk) => {
      finalRoundText += chunk;
      ctx.onTextDelta?.(finalRoundText);
    },
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
