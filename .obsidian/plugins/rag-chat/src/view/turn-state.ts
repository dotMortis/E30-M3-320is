import type { ChatTurn } from "../retrieval/types";

export function showsStatus(turn: ChatTurn): boolean {
  return turn.role === "assistant" && turn.text.length === 0 && Boolean(turn.status);
}

export function showsStreamingText(turn: ChatTurn): boolean {
  return turn.role === "assistant" && turn.text.length === 0 && Boolean(turn.streamingText);
}
