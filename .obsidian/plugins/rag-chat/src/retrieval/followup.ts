import type { ChatTurn } from "./types";

const FOLLOWUP_MARKERS = [
  "und was ist mit",
  "was ist mit",
  "und für",
  "auch für",
  "wie sieht es aus mit",
  "und wie",
  "und wo",
  "und wieviel",
  "und welche",
  "was ist",
  "und",
  "auch",
];

const FOLLOWUP_MAX_WORDS = 6;

export function resolveFollowupQuery(question: string, history: ChatTurn[]): string {
  const trimmed = question.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  const wordCount = trimmed.split(/\s+/).length;
  const looksLikeFollowup =
    wordCount <= FOLLOWUP_MAX_WORDS && FOLLOWUP_MARKERS.some((marker) => lower.startsWith(marker));
  if (!looksLikeFollowup) return trimmed;

  const lastUserTurn = [...history].reverse().find((t) => t.role === "user" && t.text.trim());
  if (!lastUserTurn) return trimmed;
  return `${lastUserTurn.text.trim()} ${trimmed}`;
}
