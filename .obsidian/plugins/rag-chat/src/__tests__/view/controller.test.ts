import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Vault } from "obsidian";
import { fakeSettings } from "../fixtures/settings";
import { TORQUE_BLOCK } from "../fixtures/context-blocks";

const answerQuestion = vi.fn();
const continueAnswer = vi.fn();
vi.mock("../../workflow", () => ({ answerQuestion, continueAnswer }));

let createChatSessionState: typeof import("../../view/controller").createChatSessionState;
let inputPlaceholder: typeof import("../../view/controller").inputPlaceholder;
let sendMessage: typeof import("../../view/controller").sendMessage;
let abandonPendingClarification: typeof import("../../view/controller").abandonPendingClarification;
let discardFailedTurn: typeof import("../../view/controller").discardFailedTurn;
let retryTurn: typeof import("../../view/controller").retryTurn;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ createChatSessionState, inputPlaceholder, sendMessage, abandonPendingClarification, discardFailedTurn, retryTurn } =
    await import("../../view/controller"));
});

const baseDeps = {
  settings: fakeSettings(),
  vault: {} as unknown as Vault,
  getIndices: async () => ({ textDb: {}, vectorDbs: [], referenceChunks: new Map() }) as any,
  getFuzzyApi: () => null,
};

const DONE_RESULT = {
  status: "done" as const,
  text: "Zylinderkopfschrauben: 30 Nm.",
  manualCitations: [TORQUE_BLOCK],
  webCitations: [],
  webGroundingChunks: [],
  webGroundingSupports: [],
};

describe("createChatSessionState", () => {
  it("returns an empty turns array and no pending state", () => {
    const state = createChatSessionState();
    expect(state.turns).toEqual([]);
    expect(state.pendingAgentState).toBeNull();
  });
});

describe("inputPlaceholder", () => {
  it("returns the default placeholder when there is no pending clarification", () => {
    const state = createChatSessionState();
    expect(inputPlaceholder(state)).toContain("Frage zum Handbuch stellen");
  });

  it("returns the clarification-reply placeholder while awaiting an answer", () => {
    const state = createChatSessionState();
    state.pendingAgentState = { state: {}, ctx: {} } as any;
    expect(inputPlaceholder(state)).toBe("Antwort auf die Rückfrage …");
  });
});

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
    // Only the first message's user+assistant turns were pushed.
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
