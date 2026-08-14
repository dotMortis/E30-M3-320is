import { buildHistoryContents } from "../gemini/history";
import type { GeminiContent } from "../gemini/types";
import { buildContextXml, escapeXml } from "../retrieval/context-xml";
import type { ChatTurn, ContextBlock } from "../retrieval/types";
import type { AgentLoopState } from "./types";

export function buildInitialState(
  question: string,
  history: ChatTurn[],
  baselineBlocks: ContextBlock[],
): AgentLoopState {
  const manualPages = new Map<string, ContextBlock>();
  for (const b of baselineBlocks) manualPages.set(b.notePath, b);

  const contextXml = buildContextXml(baselineBlocks);
  const contents: GeminiContent[] = [
    ...buildHistoryContents(history),
    {
      role: "user",
      parts: [{ text: `${contextXml}\n\n<question>\n${escapeXml(question)}\n</question>` }],
    },
  ];

  return { contents, round: 0, manualPages, webCitations: new Map() };
}

export function cloneState(state: AgentLoopState): AgentLoopState {
  return {
    contents: [...state.contents],
    round: state.round,
    manualPages: new Map(state.manualPages),
    webCitations: new Map(state.webCitations),
  };
}

export function appendClarificationAnswer(state: AgentLoopState, userAnswer: string, callId?: string): void {
  state.contents.push({
    role: "user",
    parts: [
      {
        functionResponse: {
          ...(callId ? { id: callId } : {}),
          name: "ask_user",
          response: { answer: userAnswer },
        },
      },
    ],
  });
}
