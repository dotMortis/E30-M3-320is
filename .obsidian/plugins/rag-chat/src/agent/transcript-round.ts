import { generateWithToolsStreaming } from "../gemini/generate-stream";
import { extractFinalTranscript, splitTranscriptBlock } from "../gemini/transcript-block";
import type { AgentLoopContext, AgentLoopState } from "./types";

export async function runTranscriptRound(state: AgentLoopState, ctx: AgentLoopContext): Promise<string> {
  let roundText = "";
  let transcriptSent = false;

  const result = await generateWithToolsStreaming(state.contents, null, ctx.settings, {
    includeGoogleSearch: false,
    thinkingEnabled: false,
    ttsRequested: false,
    skipSystemInstruction: true,
    onDelta: (chunk) => {
      roundText += chunk;
      if (transcriptSent) return;
      const block = splitTranscriptBlock(roundText);
      if (block.transcriptComplete) {
        transcriptSent = true;
        ctx.onTranscriptReady?.(block.transcript ?? "");
      }
    },
    signal: ctx.signal,
  });

  return extractFinalTranscript(result.parts.map((p) => p.text ?? "").join(""));
}
