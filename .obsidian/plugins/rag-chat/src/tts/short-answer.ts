import { generatePlainText } from "../gemini/client";
import type { RagChatSettings } from "../settings/types";
import { TTS_SHORT_ANSWER_MAX_CHARS } from "../constants";

// Same citation-markup patterns used by citations/page-citations.ts and
// citations/reference-citations.ts to detect/render "[Seite ...]" and
// "[Referenz: ...]" markers in the long answer text.
const CITATION_MARKUP_PATTERN = /\[Seite\s+[^\]]+\]|\[Referenz:\s*[^\]]+\]/i;

const SHORT_ANSWER_PROMPT =
  "Fasse die folgende Antwort für eine Sprachausgabe in 1-2 kurzen, klaren " +
  "Sätzen zusammen. Behalte exakte Zahlen, Einheiten und Anzugsdrehmomente " +
  "unverändert bei. Keine Zitatmarker, keine Seitencodes, keine " +
  "Markdown-Symbole.";

/**
 * Derives a short, spoken-friendly answer from an already-completed long
 * answer. Never re-runs retrieval or the agent loop, so the spoken number
 * can never drift from the long answer's number - critical for
 * safety-relevant values like torque specs.
 *
 * Fast path: if the long answer is already short and free of citation
 * markup, it is returned unchanged (trimmed), skipping the extra Flash call
 * entirely. Otherwise, a single tool-less generatePlainText call summarizes
 * it.
 */
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
