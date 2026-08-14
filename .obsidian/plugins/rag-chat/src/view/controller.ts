import type { Vault } from "obsidian";
import type { PendingAgentState } from "../agent/types";
import { answerQuestion, continueAnswer, type WorkflowResult } from "../workflow";
import type { CachedIndices, ChatTurn, FuzzySearchApi } from "../retrieval/types";
import type { RagChatSettings } from "../settings/types";

export interface ChatSessionState {
  turns: ChatTurn[];
  pendingAgentState: PendingAgentState | null;
  /**
   * True while a sendMessage() call is in flight for this session. Guarded
   * here (not just via the view's own `busy` UI flag) so any caller -
   * including a second concurrent invocation from a different code path -
   * can't kick off a second workflow against the same session state.
   */
  busy: boolean;
}

export interface SendMessageDeps {
  settings: RagChatSettings;
  vault: Vault;
  getIndices: () => Promise<CachedIndices>;
  getFuzzyApi: () => FuzzySearchApi | null;
  onTurnStarted?: (assistantTurn: ChatTurn) => void;
  onStatus?: (status: string) => void;
  onError?: (message: string) => void;
  onCancelled?: (originalMessage: string) => void;
  signal?: AbortSignal;
}

export function createChatSessionState(): ChatSessionState {
  return { turns: [], pendingAgentState: null, busy: false };
}

/**
 * Abandons a pending ask_user clarification without answering it, so the
 * next message the user sends is routed to a fresh answerQuestion() call
 * instead of being blindly submitted as "the answer" to a question they may
 * no longer even remember (or that's no longer relevant).
 */
export function abandonPendingClarification(state: ChatSessionState): void {
  state.pendingAgentState = null;
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
  if (state.busy) return;
  state.busy = true;

  try {
    await sendMessageUnguarded(state, message, deps);
  } finally {
    state.busy = false;
  }
}

async function sendMessageUnguarded(state: ChatSessionState, message: string, deps: SendMessageDeps): Promise<void> {
  const isResuming = state.pendingAgentState !== null;
  const pendingBeforeSend = state.pendingAgentState;

  const history = [...state.turns];
  const userTurn: ChatTurn = { role: "user", text: message };
  state.turns.push(userTurn);
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
      result = await continueAnswer(pending, message, deps.signal);
    } else {
      result = await answerQuestion({
        question: message,
        history,
        settings: deps.settings,
        vault: deps.vault,
        indices: await deps.getIndices(),
        fuzzyApi: deps.getFuzzyApi(),
        onStatus,
        signal: deps.signal,
      });
    }
    applyResult(assistantTurn, state, result);
  } catch (err) {
    if (deps.signal?.aborted) {
      state.turns.splice(state.turns.length - 2, 2);
      state.pendingAgentState = pendingBeforeSend;
      deps.onCancelled?.(message);
      return;
    }
    state.pendingAgentState = null;
    const errMessage = err instanceof Error ? err.message : String(err);
    assistantTurn.status = undefined;
    assistantTurn.text = `Fehler: ${errMessage}`;
    assistantTurn.citations = [];
    assistantTurn.webCitations = [];
    assistantTurn.webGroundingChunks = [];
    assistantTurn.webGroundingSupports = [];
    deps.onError?.(errMessage);
  }
}
