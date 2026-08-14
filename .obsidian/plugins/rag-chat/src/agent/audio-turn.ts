import { buildHistoryContents } from "../gemini/history";
import { TRANSCRIPT_END, TRANSCRIPT_START } from "../gemini/transcript-block";
import type { GeminiContent } from "../gemini/types";
import type { ChatTurn } from "../retrieval/types";
import type { AgentLoopState } from "./types";

const AUDIO_TURN_INSTRUCTION =
  `Transkribiere zuerst wortwörtlich das gesprochene Audio, in der Originalsprache. Gib NUR das ` +
  `Transkript aus, eingeschlossen in ${TRANSCRIPT_START} und ${TRANSCRIPT_END} - keine Anführungszeichen, ` +
  `keine Kommentare, keine Zusätze. Ist kein verständliches Audio zu erkennen, lass den Inhalt zwischen ` +
  `den Markern leer. Beantworte die Frage in dieser Runde noch NICHT - dir fehlt dafür noch der ` +
  `Handbuchkontext, der dir gleich in der nächsten Runde zugeführt wird. Tätige in dieser Runde keinen ` +
  `Funktionsaufruf.`;

export function buildAudioInitialState(base64Audio: string, mimeType: string, history: ChatTurn[]): AgentLoopState {
  const contents: GeminiContent[] = [
    ...buildHistoryContents(history),
    {
      role: "user",
      parts: [{ inlineData: { mimeType, data: base64Audio } }, { text: AUDIO_TURN_INSTRUCTION }],
    },
  ];

  return { contents, round: 0, manualPages: new Map(), webCitations: new Map() };
}
