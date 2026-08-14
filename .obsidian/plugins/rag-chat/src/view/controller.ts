import type { Vault } from "obsidian";
import type { PendingAgentState } from "../agent/types";
import { createStepReporter } from "../agent/step-reporter";
import { answerQuestion, answerQuestionFromAudio, continueAnswer, type WorkflowResult } from "../workflow";
import type { CachedIndices, ChatTurn, FuzzySearchApi, PipelineStep } from "../retrieval/types";
import type { RagChatSettings } from "../settings/types";
import { applyError, applyResult } from "./apply-result";

export interface ChatSessionState {
  turns: ChatTurn[];
  pendingAgentState: PendingAgentState | null;

  busy: boolean;
}

export interface SendMessageDeps {
  settings: RagChatSettings;
  vault: Vault;
  getIndices: () => Promise<CachedIndices>;
  getFuzzyApi: () => FuzzySearchApi | null;
  onTurnStarted?: (assistantTurn: ChatTurn) => void;
  onStep?: (step: PipelineStep) => void;

  onTextDelta?: () => void;
  onShortAnswerReady?: (assistantTurn: ChatTurn) => void;
  onTranscriptReady?: (userTurn: ChatTurn) => void;
  onError?: (message: string) => void;
  onCancelled?: (originalMessage: string) => void;

  onTurnDone?: (assistantTurn: ChatTurn) => void;
  onClarificationReady?: (assistantTurn: ChatTurn) => void;
  signal?: AbortSignal;
}

export function createChatSessionState(): ChatSessionState {
  return { turns: [], pendingAgentState: null, busy: false };
}

export function abandonPendingClarification(state: ChatSessionState): void {
  state.pendingAgentState = null;
}

export function inputPlaceholder(state: ChatSessionState): string {
  return state.pendingAgentState !== null
    ? "Antwort auf die Rückfrage …"
    : "Frage zum Handbuch stellen... (z.B. Anzugsdrehmoment Zylinderkopf)";
}

export interface SendMessageOptions {
  /** Marks the resulting turns as voice-originated so the reply is spoken even if TTS is off. */
  originatedFromVoice?: boolean;
}

export async function sendMessage(
  state: ChatSessionState,
  message: string,
  deps: SendMessageDeps,
  opts?: SendMessageOptions,
): Promise<void> {
  if (state.busy) return;
  state.busy = true;

  try {
    await sendMessageUnguarded(state, message, deps, opts);
  } finally {
    state.busy = false;
  }
}

async function sendMessageUnguarded(
  state: ChatSessionState,
  message: string,
  deps: SendMessageDeps,
  opts?: SendMessageOptions,
): Promise<void> {
  const isResuming = state.pendingAgentState !== null;
  const pendingBeforeSend = state.pendingAgentState;

  const history = [...state.turns];
  const userTurn: ChatTurn = { role: "user", text: message, originatedFromVoice: opts?.originatedFromVoice };
  state.turns.push(userTurn);
  const assistantTurn: ChatTurn = {
    role: "assistant",
    text: "",
    status: isResuming ? "Setze Suche fort …" : "Analysiere Frage …",
    originatedFromVoice: opts?.originatedFromVoice,
  };
  state.turns.push(assistantTurn);
  deps.onTurnStarted?.(assistantTurn);

  const reporter = createStepReporter((step) => {
    assistantTurn.status = step.title;
    const steps = (assistantTurn.steps ??= []);
    if (!steps.includes(step)) steps.push(step);
    deps.onStep?.(step);
  });
  const onTextDelta = (text: string) => {
    assistantTurn.streamingText = text || undefined;
    deps.onTextDelta?.();
  };
  const onShortAnswerReady = (text: string) => {
    assistantTurn.ttsShortAnswer = text;
    deps.onShortAnswerReady?.(assistantTurn);
  };

  try {
    let result: WorkflowResult;
    if (isResuming && state.pendingAgentState) {
      const pending = state.pendingAgentState;
      state.pendingAgentState = null;
      pending.ctx.reporter = reporter;
      pending.ctx.onTextDelta = onTextDelta;
      pending.ctx.onShortAnswerReady = onShortAnswerReady;
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
        onTextDelta,
        onShortAnswerReady,
        signal: deps.signal,
      });
    }
    applyResult(assistantTurn, state, result);
    if (result.status === "done") {
      deps.onTurnDone?.(assistantTurn);
    } else {
      deps.onClarificationReady?.(assistantTurn);
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
    applyError(assistantTurn, errMessage);
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

export interface VoiceMessage {
  base64Audio: string;
  mimeType: string;
}

export async function sendVoiceMessage(state: ChatSessionState, audio: VoiceMessage, deps: SendMessageDeps): Promise<void> {
  if (state.busy) return;
  state.busy = true;

  try {
    await sendVoiceMessageUnguarded(state, audio, deps);
  } finally {
    state.busy = false;
  }
}

async function sendVoiceMessageUnguarded(state: ChatSessionState, audio: VoiceMessage, deps: SendMessageDeps): Promise<void> {
  const pendingBeforeSend = state.pendingAgentState;
  const history = [...state.turns];

  const userTurn: ChatTurn = { role: "user", text: "", originatedFromVoice: true };
  state.turns.push(userTurn);
  const assistantTurn: ChatTurn = {
    role: "assistant",
    text: "",
    status: "Transkribiere Sprachaufnahme …",
    originatedFromVoice: true,
  };
  state.turns.push(assistantTurn);
  deps.onTurnStarted?.(assistantTurn);

  const reporter = createStepReporter((step) => {
    assistantTurn.status = step.title;
    const steps = (assistantTurn.steps ??= []);
    if (!steps.includes(step)) steps.push(step);
    deps.onStep?.(step);
  });
  const onTextDelta = (text: string) => {
    assistantTurn.streamingText = text || undefined;
    deps.onTextDelta?.();
  };
  const onShortAnswerReady = (text: string) => {
    assistantTurn.ttsShortAnswer = text;
    deps.onShortAnswerReady?.(assistantTurn);
  };
  const onTranscriptReady = (text: string) => {
    userTurn.text = text;
    assistantTurn.status = "Analysiere Frage …";
    deps.onTranscriptReady?.(userTurn);
  };

  try {
    const result = await answerQuestionFromAudio({
      base64Audio: audio.base64Audio,
      mimeType: audio.mimeType,
      history,
      settings: deps.settings,
      vault: deps.vault,
      indices: await deps.getIndices(),
      fuzzyApi: deps.getFuzzyApi(),
      reporter,
      onTranscriptReady,
      onTextDelta,
      onShortAnswerReady,
      signal: deps.signal,
    });
    applyResult(assistantTurn, state, result);
    if (result.status === "done") {
      deps.onTurnDone?.(assistantTurn);
    } else {
      deps.onClarificationReady?.(assistantTurn);
    }
  } catch (err) {
    if (deps.signal?.aborted) {
      state.turns.splice(state.turns.length - 2, 2);
      state.pendingAgentState = pendingBeforeSend;
      deps.onCancelled?.(userTurn.text);
      return;
    }
    state.pendingAgentState = null;
    const errMessage = err instanceof Error ? err.message : String(err);
    applyError(assistantTurn, errMessage);
    if (userTurn.text) {
      assistantTurn.retry = { message: userTurn.text, pendingBefore: pendingBeforeSend };
    }
    deps.onError?.(errMessage);
  }
}
