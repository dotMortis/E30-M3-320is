import { describe, expect, it } from "vitest";
import { createChatSessionState, inputPlaceholder } from "./controller-harness";

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

