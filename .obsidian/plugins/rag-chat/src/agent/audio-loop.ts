import type { ChatTurn, ContextBlock } from "../retrieval/types";
import { buildAudioInitialState } from "./audio-turn";
import { runAgentLoop } from "./loop";
import { runTranscriptRound } from "./transcript-round";
import type { AgentLoopContext, AgentResult } from "./types";

export interface AudioAgentLoopParams {
  base64Audio: string;
  mimeType: string;
  history: ChatTurn[];
  ctx: AgentLoopContext;
  retrieve: (transcript: string) => Promise<ContextBlock[]>;
}

export async function runAudioAgentLoop(params: AudioAgentLoopParams): Promise<AgentResult> {
  const { base64Audio, mimeType, history, ctx, retrieve } = params;
  const transcriptState = buildAudioInitialState(base64Audio, mimeType, history);

  let retrievalPromise: Promise<ContextBlock[]> | null = null;
  const transcriptCtx: AgentLoopContext = {
    ...ctx,
    onTranscriptReady: (transcript) => {
      ctx.onTranscriptReady?.(transcript);
      if (transcript) retrievalPromise ??= retrieve(transcript);
    },
  };

  const transcript = await runTranscriptRound(transcriptState, transcriptCtx);
  if (!transcript) {
    throw new Error("Keine verständliche Sprache erkannt.");
  }

  const baselineBlocks = await (retrievalPromise ?? retrieve(transcript));

  return runAgentLoop({ question: transcript, history, baselineBlocks, ctx });
}
