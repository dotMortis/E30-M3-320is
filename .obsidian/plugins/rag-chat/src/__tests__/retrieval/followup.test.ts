import { describe, expect, it } from "vitest";
import { resolveFollowupQuery } from "../../retrieval/followup";
import type { ChatTurn } from "../../retrieval/types";

function userTurn(text: string): ChatTurn {
  return { role: "user", text };
}
function assistantTurn(text: string): ChatTurn {
  return { role: "assistant", text };
}

describe("resolveFollowupQuery", () => {
  it("returns the trimmed question unchanged when it does not look like a follow-up", () => {
    expect(resolveFollowupQuery("  Anzugsdrehmoment Zylinderkopf?  ", [])).toBe("Anzugsdrehmoment Zylinderkopf?");
  });

  it("returns the trimmed empty string for a blank question", () => {
    expect(resolveFollowupQuery("   ", [])).toBe("");
  });

  it("returns the raw question when it looks like a follow-up but there is no history", () => {
    expect(resolveFollowupQuery("und was ist mit 16-03?", [])).toBe("und was ist mit 16-03?");
  });

  it("prepends the last user turn's text for a short follow-up marker match", () => {
    const history = [userTurn("Wie baue ich den Tank aus?"), assistantTurn("Siehe Seite 16-01.")];
    expect(resolveFollowupQuery("und was ist mit 16-03?", history)).toBe(
      "Wie baue ich den Tank aus? und was ist mit 16-03?"
    );
  });

  it("matches a bare 'und' marker at the start", () => {
    const history = [userTurn("Wie baue ich den Tank aus?")];
    expect(resolveFollowupQuery("und die Pumpe?", history)).toBe("Wie baue ich den Tank aus? und die Pumpe?");
  });

  it("matches case-insensitively", () => {
    const history = [userTurn("Wie baue ich den Tank aus?")];
    expect(resolveFollowupQuery("UND was ist mit 16-03?", history)).toBe(
      "Wie baue ich den Tank aus? UND was ist mit 16-03?"
    );
  });

  it("does not treat a long question starting with a marker as a follow-up", () => {
    const history = [userTurn("Wie baue ich den Tank aus?")];
    const longQuestion = "und was ist mit dem gesamten Kraftstoffsystem und allen Leitungen sowie Filtern zusammen?";
    expect(resolveFollowupQuery(longQuestion, history)).toBe(longQuestion);
  });

  it("skips over the most recent assistant turn to find the last USER turn", () => {
    const history = [userTurn("Wie baue ich den Tank aus?"), assistantTurn("Siehe Seite 16-01.")];
    const result = resolveFollowupQuery("auch für 16-03?", history);
    expect(result.startsWith("Wie baue ich den Tank aus?")).toBe(true);
  });

  it("skips a user turn with only whitespace text when looking for the last real user turn", () => {
    const history = [userTurn("Wie baue ich den Tank aus?"), userTurn("   ")];
    const result = resolveFollowupQuery("und die Pumpe?", history);
    expect(result).toBe("Wie baue ich den Tank aus? und die Pumpe?");
  });

  it("falls through to the raw trimmed question when a marker matches mid-word rather than at the start", () => {
    expect(resolveFollowupQuery("Verstehe und bitte erkläre mehr.", [userTurn("x")])).toBe(
      "Verstehe und bitte erkläre mehr."
    );
  });
});
