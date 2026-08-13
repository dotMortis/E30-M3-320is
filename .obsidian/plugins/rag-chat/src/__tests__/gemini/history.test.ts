import { describe, expect, it } from "vitest";
import { buildHistoryContents } from "../../gemini/history";
import type { ChatTurn } from "../../retrieval/types";

describe("buildHistoryContents", () => {
  it("returns an empty array for empty history", () => {
    expect(buildHistoryContents([])).toEqual([]);
  });

  it("maps a user turn to role 'user'", () => {
    const history: ChatTurn[] = [{ role: "user", text: "Wie baue ich den Tank aus?" }];
    expect(buildHistoryContents(history)).toEqual([
      { role: "user", parts: [{ text: "Wie baue ich den Tank aus?" }] },
    ]);
  });

  it("maps an assistant turn to role 'model' (Gemini's naming)", () => {
    const history: ChatTurn[] = [{ role: "assistant", text: "Siehe Seite 16-01." }];
    expect(buildHistoryContents(history)).toEqual([{ role: "model", parts: [{ text: "Siehe Seite 16-01." }] }]);
  });

  it("drops a turn with empty text (e.g. an in-progress assistant turn)", () => {
    const history: ChatTurn[] = [
      { role: "user", text: "Frage" },
      { role: "assistant", text: "" },
    ];
    expect(buildHistoryContents(history)).toEqual([{ role: "user", parts: [{ text: "Frage" }] }]);
  });

  it("drops a turn whose text is only whitespace", () => {
    const history: ChatTurn[] = [{ role: "assistant", text: "   " }];
    expect(buildHistoryContents(history)).toEqual([]);
  });

  it("preserves turn order across multiple turns", () => {
    const history: ChatTurn[] = [
      { role: "user", text: "erste Frage" },
      { role: "assistant", text: "erste Antwort" },
      { role: "user", text: "zweite Frage" },
    ];
    const result = buildHistoryContents(history);
    expect(result.map((c) => c.parts[0].text)).toEqual(["erste Frage", "erste Antwort", "zweite Frage"]);
  });

  it("ignores non-text fields on the turn (citations, statusLog, etc.)", () => {
    const history: ChatTurn[] = [
      { role: "assistant", text: "Antwort", statusLog: ["step 1"], citations: [], isClarifying: true },
    ];
    expect(buildHistoryContents(history)).toEqual([{ role: "model", parts: [{ text: "Antwort" }] }]);
  });
});
