import type { ChatTurn } from "../retrieval/types";
import type { GeminiContent } from "./types";

export function buildHistoryContents(history: ChatTurn[]): GeminiContent[] {
  return history
    .filter((t) => t.text.trim().length > 0)
    .map((t) => ({
      role: t.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: t.text }],
    }));
}
