import type { Vault } from "obsidian";
import type { PendingAgentState } from "../agent/types";
import { createStepReporter } from "../agent/step-reporter";
import { answerQuestion, continueAnswer, type WorkflowResult } from "../workflow";
import type { CachedIndices, ChatTurn, FuzzySearchApi, PipelineStep } from "../retrieval/types";
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
  onStep?: (step: PipelineStep) => void;
  onError?: (message: string) => void;
  onCancelled?: (originalMessage: string) => void;
  /**
   * Fired once per turn, only for a genuine "done" result - never for
   * awaiting_clarification, and never on the caught-exception/error path
   * (see sendMessageUnguarded's try/catch below). Used to gate the optional
   * post-answer TTS pipeline without letting it see clarification questions
   * or error text.
   */
  onTurnDone?: (assistantTurn: ChatTurn) => void;
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

  const reporter = createStepReporter((step) => {
    assistantTurn.status = step.title;
    const steps = (assistantTurn.steps ??= []);
    if (!steps.includes(step)) steps.push(step);
    deps.onStep?.(step);
  });

  try {
    let result: WorkflowResult;
    if (isResuming && state.pendingAgentState) {
      const pending = state.pendingAgentState;
      state.pendingAgentState = null;
      pending.ctx.reporter = reporter;
      result = await continueAnswer(pending, message, deps.signal);
    } else {
      result = await answerQuestion({
        question: message,
        history,
        settings: deps.settings,
        vault: deps.vault,
        indices: await deps.getIndices(),
        fuzzyApi: deps.getFuzzyApi(),
        reporter,
        signal: deps.signal,
      });
    }
    applyResult(assistantTurn, state, result);
    if (result.status === "done") {
      deps.onTurnDone?.(assistantTurn);
    }
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
    assistantTurn.retry = { message, pendingBefore: pendingBeforeSend };
    deps.onError?.(errMessage);
  }
}

export function discardFailedTurn(state: ChatSessionState, turn: ChatTurn): string | null {
  if (state.busy) return null;
  const idx = state.turns.indexOf(turn);
  if (idx < 1 || !turn.retry) return null;
  const userTurn = state.turns[idx - 1];
  if (userTurn.role !== "user") return null;
  const { message, pendingBefore } = turn.retry;
  state.turns.splice(idx - 1, 2);
  state.pendingAgentState = pendingBefore;
  return message;
}

export async function retryTurn(state: ChatSessionState, turn: ChatTurn, deps: SendMessageDeps): Promise<void> {
  const message = discardFailedTurn(state, turn);
  if (message === null) return;
  await sendMessage(state, message, deps);
}
