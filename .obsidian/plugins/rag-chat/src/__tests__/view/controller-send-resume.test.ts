import { describe, expect, it, vi } from "vitest";
import { DONE_RESULT, answerQuestion, baseDeps, continueAnswer, createChatSessionState, sendMessage } from "./controller-harness";

describe("sendMessage (resume, errors, concurrency)", () => {
  it("never calls getIndices/getFuzzyApi while resuming a paused clarification (index loading is skipped entirely)", async () => {
    continueAnswer.mockResolvedValue(DONE_RESULT);
    const state = createChatSessionState();
    state.pendingAgentState = { state: {}, ctx: {} } as any;
    const getIndices = vi.fn(baseDeps.getIndices);
    const getFuzzyApi = vi.fn(baseDeps.getFuzzyApi);

    await sendMessage(state, "1988", { ...baseDeps, getIndices, getFuzzyApi });

    expect(getIndices).not.toHaveBeenCalled();
    expect(getFuzzyApi).not.toHaveBeenCalled();
  });

  it("uses the 'resuming' initial status label when a pending clarification exists", async () => {
    continueAnswer.mockResolvedValue(DONE_RESULT);
    const state = createChatSessionState();
    state.pendingAgentState = { state: {}, ctx: {} } as any;
    let statusAtStart: string | undefined;
    const onTurnStarted = vi.fn((turn) => {
      statusAtStart = turn.status;
    });
    await sendMessage(state, "1988", { ...baseDeps, onTurnStarted });
    expect(statusAtStart).toBe("Setze Suche fort …");
  });

  it("records reporter steps into the assistant turn's steps and forwards them to deps.onStep", async () => {
    answerQuestion.mockImplementation(async ({ reporter }: { reporter?: any }) => {
      const step = reporter.start({ kind: "retrieval", title: "Durchsuche Handbuch …" });
      reporter.finish(step, { title: "Basis-Suche: 3 Seite(n) gefunden" });
      return DONE_RESULT;
    });
    const state = createChatSessionState();
    const onStep = vi.fn();
    await sendMessage(state, "Frage?", { ...baseDeps, onStep });
    expect(state.turns[1].steps).toHaveLength(1);
    expect(state.turns[1].steps![0].title).toBe("Basis-Suche: 3 Seite(n) gefunden");
    expect(onStep).toHaveBeenCalledTimes(2);
  });

  it("sets an error message on the turn and calls onError when the workflow throws", async () => {
    answerQuestion.mockRejectedValue(new Error("Google API key is required"));
    const state = createChatSessionState();
    const onError = vi.fn();
    await sendMessage(state, "Frage?", { ...baseDeps, onError });
    expect(state.turns[1].text).toBe("Fehler: Google API key is required");
    expect(state.turns[1].citations).toEqual([]);
    expect(onError).toHaveBeenCalledWith("Google API key is required");
  });

  it("attaches retry recovery data to a failed turn", async () => {
    answerQuestion.mockRejectedValue(new Error("Server overloaded"));
    const state = createChatSessionState();
    await sendMessage(state, "Frage?", baseDeps);
    expect(state.turns[1].retry).toEqual({ message: "Frage?", pendingBefore: null });
  });

  it("captures the pending clarification state active before the failed resume as pendingBefore", async () => {
    const pending = { state: {}, ctx: {} } as any;
    continueAnswer.mockRejectedValue(new Error("Server overloaded"));
    const state = createChatSessionState();
    state.pendingAgentState = pending;
    await sendMessage(state, "1988", baseDeps);
    expect(state.turns[1].retry).toEqual({ message: "1988", pendingBefore: pending });
  });

  it("clears pendingAgentState when the workflow throws, even while resuming", async () => {
    continueAnswer.mockRejectedValue(new Error("boom"));
    const state = createChatSessionState();
    state.pendingAgentState = { state: {}, ctx: {} } as any;
    await sendMessage(state, "1988", baseDeps);
    expect(state.pendingAgentState).toBeNull();
  });

  it("stringifies a non-Error throw value", async () => {
    answerQuestion.mockRejectedValue("plain string failure");
    const state = createChatSessionState();
    await sendMessage(state, "Frage?", baseDeps);
    expect(state.turns[1].text).toBe("Fehler: plain string failure");
  });

  it("ignores a concurrent sendMessage call while one is already in flight for the same session", async () => {
    let resolveFirst!: (v: typeof DONE_RESULT) => void;
    answerQuestion.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)));
    const state = createChatSessionState();

    const first = sendMessage(state, "Erste Frage", baseDeps);
    const second = sendMessage(state, "Zweite Frage (sollte ignoriert werden)", baseDeps);

    resolveFirst(DONE_RESULT);
    await Promise.all([first, second]);

    expect(answerQuestion).toHaveBeenCalledTimes(1);
    expect(state.turns).toHaveLength(2);
    expect(state.turns[0]).toEqual({ role: "user", text: "Erste Frage" });
  });

  it("allows a new sendMessage call once the previous one has finished", async () => {
    answerQuestion.mockResolvedValue(DONE_RESULT);
    const state = createChatSessionState();
    await sendMessage(state, "Erste Frage", baseDeps);
    await sendMessage(state, "Zweite Frage", baseDeps);
    expect(answerQuestion).toHaveBeenCalledTimes(2);
    expect(state.turns).toHaveLength(4);
  });
});
