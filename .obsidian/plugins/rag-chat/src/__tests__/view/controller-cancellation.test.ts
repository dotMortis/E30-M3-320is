import { describe, expect, it, vi } from "vitest";
import { DONE_RESULT, answerQuestion, baseDeps, continueAnswer, createChatSessionState, sendMessage } from "./controller-harness";

describe("sendMessage cancellation", () => {
  it("reverts turns to the pre-send state and calls onCancelled instead of onError when aborted", async () => {
    const controller = new AbortController();
    answerQuestion.mockImplementation(() => {
      controller.abort();
      return Promise.reject(new Error("Anfrage abgebrochen."));
    });
    const state = createChatSessionState();
    const onError = vi.fn();
    const onCancelled = vi.fn();
    await sendMessage(state, "Frage?", { ...baseDeps, onError, onCancelled, signal: controller.signal });

    expect(state.turns).toHaveLength(0);
    expect(onCancelled).toHaveBeenCalledWith("Frage?");
    expect(onError).not.toHaveBeenCalled();
  });

  it("keeps prior turns intact and only reverts the cancelled message's own turns", async () => {
    answerQuestion.mockResolvedValueOnce(DONE_RESULT);
    const state = createChatSessionState();
    await sendMessage(state, "Erste Frage", baseDeps);

    const controller = new AbortController();
    answerQuestion.mockImplementation(() => {
      controller.abort();
      return Promise.reject(new Error("Anfrage abgebrochen."));
    });
    await sendMessage(state, "Zweite Frage", { ...baseDeps, signal: controller.signal });

    expect(state.turns).toHaveLength(2);
    expect(state.turns[0]).toEqual({ role: "user", text: "Erste Frage" });
  });

  it("restores the original pending clarification state when cancelling a resumed answer", async () => {
    const controller = new AbortController();
    const pending = { state: {}, ctx: {} } as any;
    continueAnswer.mockImplementation(() => {
      controller.abort();
      return Promise.reject(new Error("Anfrage abgebrochen."));
    });
    const state = createChatSessionState();
    state.pendingAgentState = pending;

    await sendMessage(state, "1988", { ...baseDeps, signal: controller.signal });

    expect(state.pendingAgentState).toBe(pending);
    expect(state.turns).toHaveLength(0);
  });

  it("does not treat a real error alongside an unrelated live signal as a cancellation", async () => {
    const controller = new AbortController();
    answerQuestion.mockRejectedValue(new Error("Google API key is required"));
    const state = createChatSessionState();
    const onCancelled = vi.fn();
    const onError = vi.fn();
    await sendMessage(state, "Frage?", { ...baseDeps, onCancelled, onError, signal: controller.signal });

    expect(state.turns).toHaveLength(2);
    expect(onCancelled).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("Google API key is required");
  });
});

