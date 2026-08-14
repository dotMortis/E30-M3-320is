import { describe, expect, it, vi } from "vitest";
import { TORQUE_BLOCK } from "../fixtures/context-blocks";
import { DONE_RESULT, answerQuestion, baseDeps, continueAnswer, createChatSessionState, sendMessage } from "./controller-harness";

describe("sendMessage", () => {
  it("pushes a user turn followed by an assistant turn with an initial status", async () => {
    answerQuestion.mockResolvedValue(DONE_RESULT);
    const state = createChatSessionState();
    await sendMessage(state, "Anzugsdrehmoment?", baseDeps);
    expect(state.turns[0]).toEqual({ role: "user", text: "Anzugsdrehmoment?" });
    expect(state.turns[1].role).toBe("assistant");
  });

  it("calls onTurnStarted synchronously with the new assistant turn before the workflow resolves", async () => {
    let resolveAnswer!: (v: typeof DONE_RESULT) => void;
    answerQuestion.mockReturnValue(new Promise((resolve) => (resolveAnswer = resolve)));
    const state = createChatSessionState();
    const onTurnStarted = vi.fn();

    const promise = sendMessage(state, "Frage?", { ...baseDeps, onTurnStarted });
    expect(onTurnStarted).toHaveBeenCalledTimes(1);
    expect(onTurnStarted.mock.calls[0][0]).toBe(state.turns[1]);

    resolveAnswer(DONE_RESULT);
    await promise;
  });

  it("passes history snapshotted BEFORE the new turns were pushed", async () => {
    answerQuestion.mockResolvedValue(DONE_RESULT);
    const state = createChatSessionState();
    state.turns.push({ role: "user", text: "Erste Frage" }, { role: "assistant", text: "Erste Antwort" });
    await sendMessage(state, "Zweite Frage", baseDeps);
    expect(answerQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        question: "Zweite Frage",
        history: [{ role: "user", text: "Erste Frage" }, { role: "assistant", text: "Erste Antwort" }],
      })
    );
  });

  it("applies a 'done' result to the assistant turn", async () => {
    answerQuestion.mockResolvedValue(DONE_RESULT);
    const state = createChatSessionState();
    await sendMessage(state, "Frage?", baseDeps);
    const turn = state.turns[1];
    expect(turn.text).toBe(DONE_RESULT.text);
    expect(turn.citations).toEqual([TORQUE_BLOCK]);
    expect(turn.isClarifying).toBe(false);
    expect(turn.status).toBeUndefined();
  });

  it("calls onTurnDone with the assistant turn for a genuine 'done' result", async () => {
    answerQuestion.mockResolvedValue(DONE_RESULT);
    const state = createChatSessionState();
    const onTurnDone = vi.fn();
    await sendMessage(state, "Frage?", { ...baseDeps, onTurnDone });
    expect(onTurnDone).toHaveBeenCalledTimes(1);
    expect(onTurnDone).toHaveBeenCalledWith(state.turns[1]);
  });

  it("does not call onTurnDone for an 'awaiting_clarification' result", async () => {
    const pending = { state: {}, ctx: {} } as any;
    answerQuestion.mockResolvedValue({ status: "awaiting_clarification", question: "Welches Baujahr?", pending });
    const state = createChatSessionState();
    const onTurnDone = vi.fn();
    await sendMessage(state, "Frage?", { ...baseDeps, onTurnDone });
    expect(onTurnDone).not.toHaveBeenCalled();
  });

  it("does not call onTurnDone when the workflow throws (error path)", async () => {
    answerQuestion.mockRejectedValue(new Error("boom"));
    const state = createChatSessionState();
    const onTurnDone = vi.fn();
    await sendMessage(state, "Frage?", { ...baseDeps, onTurnDone });
    expect(onTurnDone).not.toHaveBeenCalled();
  });

  it("does not call onTurnDone when the request is cancelled", async () => {
    const controller = new AbortController();
    answerQuestion.mockImplementation(() => {
      controller.abort();
      return Promise.reject(new Error("Anfrage abgebrochen."));
    });
    const state = createChatSessionState();
    const onTurnDone = vi.fn();
    await sendMessage(state, "Frage?", { ...baseDeps, onTurnDone, signal: controller.signal });
    expect(onTurnDone).not.toHaveBeenCalled();
  });

  it("falls back to a default message when the final text is empty", async () => {
    answerQuestion.mockResolvedValue({ ...DONE_RESULT, text: "   " });
    const state = createChatSessionState();
    await sendMessage(state, "Frage?", baseDeps);
    expect(state.turns[1].text).toBe("Ich habe leider keine Antwort erhalten.");
  });

  it("applies an 'awaiting_clarification' result: sets isClarifying, question text, and pendingAgentState", async () => {
    const pending = { state: {}, ctx: {} } as any;
    answerQuestion.mockResolvedValue({ status: "awaiting_clarification", question: "Welches Baujahr?", pending });
    const state = createChatSessionState();
    await sendMessage(state, "Frage?", baseDeps);
    const turn = state.turns[1];
    expect(turn.isClarifying).toBe(true);
    expect(turn.text).toBe("Welches Baujahr?");
    expect(turn.citations).toEqual([]);
    expect(state.pendingAgentState).toBe(pending);
  });

  it("uses continueAnswer instead of answerQuestion when a pending clarification exists", async () => {
    const pending = { state: {}, ctx: {} } as any;
    continueAnswer.mockResolvedValue(DONE_RESULT);
    const state = createChatSessionState();
    state.pendingAgentState = pending;

    await sendMessage(state, "1988", baseDeps);

    expect(continueAnswer).toHaveBeenCalledWith(pending, "1988", undefined);
    expect(answerQuestion).not.toHaveBeenCalled();
    expect(state.pendingAgentState).toBeNull();
  });
});
