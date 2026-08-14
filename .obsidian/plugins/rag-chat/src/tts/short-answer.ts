import { generatePlainText } from "../gemini/client";
import type { RagChatSettings } from "../settings/types";
import { TTS_SHORT_ANSWER_MAX_CHARS } from "../constants";

const CITATION_MARKUP_PATTERN = /\[Seite\s+[^\]]+\]|\[Referenz:\s*[^\]]+\]/i;

const SHORT_ANSWER_PROMPT =
  "Fasse die folgende Antwort für eine Sprachausgabe in 1-2 kurzen, klaren " +
  "Sätzen zusammen. Behalte exakte Zahlen, Einheiten und Anzugsdrehmomente " +
  "unverändert bei. Keine Zitatmarker, keine Seitencodes, keine " +
  "Markdown-Symbole.";

export async function buildShortAnswer(
  longText: string,
  settings: RagChatSettings,
  opts?: { signal?: AbortSignal }
): Promise<string> {
  const trimmed = longText.trim();
  if (trimmed.length <= TTS_SHORT_ANSWER_MAX_CHARS && !CITATION_MARKUP_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const result = await generatePlainText(
    [
      {
        role: "user",
        parts: [{ text: `${SHORT_ANSWER_PROMPT}\n\n---\n\n${trimmed}` }],
      },
    ],
    settings,
    opts
  );

  return result.trim();
}
