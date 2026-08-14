import { ABORT_ERROR_MESSAGE } from "../constants";
import type { GeminiPart } from "../gemini/types";
import { executeTool } from "./execute-tool";
import { describeCall, describeToolNarration, extractToolHits } from "./status-text";
import type { StepReporter } from "./step-reporter";
import type { AgentLoopContext, AgentLoopState } from "./types";

type FunctionCall = NonNullable<GeminiPart["functionCall"]>;

export async function runToolCalls(
  calls: FunctionCall[],
  ctx: AgentLoopContext,
  state: AgentLoopState,
  reporter: StepReporter,
): Promise<GeminiPart[]> {
  const responseParts: GeminiPart[] = [];
  for (const fc of calls) {
    if (ctx.signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);

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

    responseParts.push({
      functionResponse: {
        ...(fc.id ? { id: fc.id } : {}),
        name: fc.name,
        response,
      },
    });
  }
  return responseParts;
}
