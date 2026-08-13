import type { Vault } from "obsidian";
import type { PendingAgentState } from "../agent/types";
import { answerQuestion, continueAnswer, type WorkflowResult } from "../workflow";
import type { CachedIndices, ChatTurn, FuzzySearchApi } from "../retrieval/types";
import type { RagChatSettings } from "../settings/types";

export interface ChatSessionState {
  turns: ChatTurn[];
  pendingAgentState: PendingAgentState | null;
}

export interface SendMessageDeps {
  settings: RagChatSettings;
  vault: Vault;
  getIndices: () => Promise<CachedIndices>;
  getFuzzyApi: () => FuzzySearchApi | null;
  onTurnStarted?: (assistantTurn: ChatTurn) => void;
  onStatus?: (status: string) => void;
  onError?: (message: string) => void;
}

export function createChatSessionState(): ChatSessionState {
  return { turns: [], pendingAgentState: null };
}

export function inputPlaceholder(state: ChatSessionState): string {
  return state.pendingAgentState !== null
    ? "Antwort auf die Rückfrage …"
    : "Frage zum Handbuch stellen... (z.B. Anzugsdrehmoment Zylinderkopf)";
}

function applyResult(turn: ChatTurn, state: ChatSessionState, result: WorkflowResult): void {
  turn.status = undefined;
  if (result.status === "awaiting_clarification") {
    state.pendingAgentState = result.pending;
    turn.text = result.question;
    turn.isClarifying = true;
    turn.citations = [];
    turn.webCitations = [];
    turn.webGroundingChunks = [];
    turn.webGroundingSupports = [];
  } else {
    turn.text = result.text.trim() || "Ich habe leider keine Antwort erhalten.";
    turn.isClarifying = false;
    turn.citations = result.manualCitations;
    turn.webCitations = result.webCitations;
    turn.webGroundingChunks = result.webGroundingChunks;
    turn.webGroundingSupports = result.webGroundingSupports;
  }
}

export async function sendMessage(state: ChatSessionState, message: string, deps: SendMessageDeps): Promise<void> {
  const isResuming = state.pendingAgentState !== null;

  const history = [...state.turns];
  state.turns.push({ role: "user", text: message });
  const assistantTurn: ChatTurn = {
    role: "assistant",
    text: "",
    status: isResuming ? "Setze Suche fort …" : "Analysiere Frage …",
  };
  state.turns.push(assistantTurn);
  deps.onTurnStarted?.(assistantTurn);

  const onStatus = (status: string) => {
    assistantTurn.status = status;
    (assistantTurn.statusLog ??= []).push(status);
    deps.onStatus?.(status);
  };

  try {
    let result: WorkflowResult;
    if (isResuming && state.pendingAgentState) {
      const pending = state.pendingAgentState;
      state.pendingAgentState = null;
      result = await continueAnswer(pending, message);
    } else {
      result = await answerQuestion({
        question: message,
        history,
        settings: deps.settings,
        vault: deps.vault,
        indices: await deps.getIndices(),
        fuzzyApi: deps.getFuzzyApi(),
        onStatus,
      });
    }
    applyResult(assistantTurn, state, result);
  } catch (err) {
    state.pendingAgentState = null;
    const message = err instanceof Error ? err.message : String(err);
    assistantTurn.status = undefined;
    assistantTurn.text = `Fehler: ${message}`;
    assistantTurn.citations = [];
    assistantTurn.webCitations = [];
    assistantTurn.webGroundingChunks = [];
    assistantTurn.webGroundingSupports = [];
    deps.onError?.(message);
  }
}
