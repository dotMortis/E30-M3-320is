import type { ChatTurn } from "../retrieval/types";
import type { WorkflowResult } from "../workflow";
import type { ChatSessionState } from "./controller";

function clearCitations(turn: ChatTurn): void {
  turn.citations = [];
  turn.webCitations = [];
  turn.webGroundingChunks = [];
  turn.webGroundingSupports = [];
}

export function applyResult(turn: ChatTurn, state: ChatSessionState, result: WorkflowResult): void {
  turn.status = undefined;
  turn.streamingText = undefined;
  if (result.status === "awaiting_clarification") {
    state.pendingAgentState = result.pending;
    turn.text = result.question;
    turn.isClarifying = true;
    clearCitations(turn);
  } else {
    turn.text = result.text.trim() || "Ich habe leider keine Antwort erhalten.";
    turn.ttsShortAnswer = result.shortAnswer;
    turn.isClarifying = false;
    turn.citations = result.manualCitations;
    turn.webCitations = result.webCitations;
    turn.webGroundingChunks = result.webGroundingChunks;
    turn.webGroundingSupports = result.webGroundingSupports;
  }
}

export function applyError(turn: ChatTurn, message: string): void {
  turn.status = undefined;
  turn.text = `Fehler: ${message}`;
  clearCitations(turn);
}
