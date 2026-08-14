import { describe, expect, it, vi } from "vitest";
import { DONE_RESULT, abandonPendingClarification, answerQuestion, baseDeps, continueAnswer, createChatSessionState, discardFailedTurn, retryTurn, sendMessage } from "./controller-harness";

describe("abandonPendingClarification", () => {
  it("clears pendingAgentState so the next message starts a fresh answerQuestion", async () => {
    const state = createChatSessionState();
    state.pendingAgentState = { state: {}, ctx: {} } as any;

    abandonPendingClarification(state);
    expect(state.pendingAgentState).toBeNull();

    answerQuestion.mockResolvedValue(DONE_RESULT);
    await sendMessage(state, "Neue, unabhängige Frage", baseDeps);
    expect(answerQuestion).toHaveBeenCalled();
    expect(continueAnswer).not.toHaveBeenCalled();
  });
});

describe("discardFailedTurn", () => {
  it("removes the user+assistant pair and returns the original message", async () => {
    answerQuestion.mockRejectedValue(new Error("boom"));
    const state = createChatSessionState();
    await sendMessage(state, "Frage?", baseDeps);
    const failedTurn = state.turns[1];

    const message = discardFailedTurn(state, failedTurn);

    expect(message).toBe("Frage?");
    expect(state.turns).toHaveLength(0);
  });

  it("restores the pendingAgentState that was active before the failed prompt", async () => {
    const pending = { state: {}, ctx: {} } as any;
    continueAnswer.mockRejectedValue(new Error("boom"));
    const state = createChatSessionState();
    state.pendingAgentState = pending;
    await sendMessage(state, "1988", baseDeps);
    const failedTurn = state.turns[1];

    discardFailedTurn(state, failedTurn);

    expect(state.pendingAgentState).toBe(pending);
  });

  it("returns null and does nothing for a turn without retry data", () => {
    const state = createChatSessionState();
    const turn = { role: "assistant" as const, text: "Antwort" };
    state.turns.push({ role: "user", text: "Frage" }, turn);

    expect(discardFailedTurn(state, turn)).toBeNull();
    expect(state.turns).toHaveLength(2);
  });

  it("returns null when the session is busy", async () => {
    let resolveAnswer!: (v: typeof DONE_RESULT) => void;
    answerQuestion.mockReturnValue(new Promise((resolve) => (resolveAnswer = resolve)));
    const state = createChatSessionState();
    const pending = sendMessage(state, "Frage?", baseDeps);

    const turn = { role: "assistant" as const, text: "Fehler: x", retry: { message: "Frage?", pendingBefore: null } };
    expect(discardFailedTurn(state, turn)).toBeNull();

    resolveAnswer(DONE_RESULT);
    await pending;
  });
});

describe("retryTurn", () => {
  it("discards the failed turn and resends the original message", async () => {
    answerQuestion.mockRejectedValueOnce(new Error("boom"));
    const state = createChatSessionState();
    await sendMessage(state, "Frage?", baseDeps);
    const failedTurn = state.turns[1];

    answerQuestion.mockResolvedValueOnce(DONE_RESULT);
    await retryTurn(state, failedTurn, baseDeps);

    expect(answerQuestion).toHaveBeenLastCalledWith(expect.objectContaining({ question: "Frage?" }));
    expect(state.turns).toHaveLength(2);
    expect(state.turns[1].text).toBe(DONE_RESULT.text);
  });

  it("resumes via continueAnswer when the failure happened during a paused clarification", async () => {
    const pending = { state: {}, ctx: {} } as any;
    continueAnswer.mockRejectedValueOnce(new Error("boom"));
    const state = createChatSessionState();
    state.pendingAgentState = pending;
    await sendMessage(state, "1988", baseDeps);
    const failedTurn = state.turns[1];

    continueAnswer.mockResolvedValueOnce(DONE_RESULT);
    await retryTurn(state, failedTurn, baseDeps);

    expect(continueAnswer).toHaveBeenLastCalledWith(pending, "1988", undefined);
  });

  it("is a no-op when the turn has no retry data", async () => {
    const state = createChatSessionState();
    const turn = { role: "assistant" as const, text: "Antwort" };
    state.turns.push({ role: "user", text: "Frage" }, turn);

    await retryTurn(state, turn, baseDeps);

    expect(answerQuestion).not.toHaveBeenCalled();
    expect(state.turns).toHaveLength(2);
  });
});
