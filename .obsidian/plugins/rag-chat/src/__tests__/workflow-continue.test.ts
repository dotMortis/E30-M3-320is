import { describe, expect, it, vi } from "vitest";
import { continueAnswer, resumeAgentLoop } from "./workflow-harness";

describe("continueAnswer", () => {
  it("delegates to resumeAgentLoop and maps a 'done' result", async () => {
    resumeAgentLoop.mockResolvedValue({
      status: "done",
      text: "Fortgesetzte Antwort",
      manualCitations: [],
      webCitations: [],
      webGroundingChunks: [],
      webGroundingSupports: [],
    });
    const pending = { state: {}, ctx: {} } as any;
    const result = await continueAnswer(pending, "1988");
    expect(resumeAgentLoop).toHaveBeenCalledWith(pending, "1988", undefined);
    expect(result).toMatchObject({ status: "done", text: "Fortgesetzte Antwort" });
  });

  it("maps an 'awaiting_clarification' result from a second consecutive clarifying question", async () => {
    const pending2 = { state: {}, ctx: {} } as any;
    resumeAgentLoop.mockResolvedValue({ status: "awaiting_clarification", question: "Und welches Modell?", pending: pending2 });
    const result = await continueAnswer({ state: {}, ctx: {} } as any, "1988");
    expect(result).toEqual({ status: "awaiting_clarification", question: "Und welches Modell?", pending: pending2 });
  });

  it("rejects immediately without resuming the agent loop when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const pending = { state: {}, ctx: {} } as any;
    await expect(continueAnswer(pending, "1988", controller.signal)).rejects.toThrow("Anfrage abgebrochen.");
    expect(resumeAgentLoop).not.toHaveBeenCalled();
  });
});
