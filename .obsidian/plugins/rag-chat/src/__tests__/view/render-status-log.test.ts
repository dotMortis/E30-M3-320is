import { describe, expect, it } from "vitest";
import { makeEl, type FakeElement } from "../mocks/dom";
import { appendStatusLogLine, renderStatusLog, showsStatus } from "../../view/render-status-log";
import type { ChatTurn } from "../../retrieval/types";

function fake(el: HTMLElement): FakeElement {
  return el as unknown as FakeElement;
}

describe("showsStatus", () => {
  it("returns true for an assistant turn with empty text and a set status", () => {
    const turn: ChatTurn = { role: "assistant", text: "", status: "Suche läuft …" };
    expect(showsStatus(turn)).toBe(true);
  });

  it("returns false once the turn has real text", () => {
    const turn: ChatTurn = { role: "assistant", text: "Antwort", status: "Suche läuft …" };
    expect(showsStatus(turn)).toBe(false);
  });

  it("returns false for a user turn even with empty text and a status", () => {
    const turn: ChatTurn = { role: "user", text: "", status: "irrelevant" };
    expect(showsStatus(turn)).toBe(false);
  });

  it("returns false when there is no status at all", () => {
    const turn: ChatTurn = { role: "assistant", text: "" };
    expect(showsStatus(turn)).toBe(false);
  });
});

describe("renderStatusLog", () => {
  it("renders a collapsed <details> block with the step count in the summary", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "Antwort", statusLog: ["Schritt 1", "Schritt 2"] };
    const { summaryEl } = renderStatusLog(turnEl as unknown as HTMLElement, turn);
    expect(fake(summaryEl).text).toBe("Rechercheverlauf (2 Schritte)");
  });

  it("renders one <li> per status log entry, in order", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "Antwort", statusLog: ["a", "b", "c"] };
    const { listEl } = renderStatusLog(turnEl as unknown as HTMLElement, turn);
    const items = fake(listEl).children.map((c) => c.text);
    expect(items).toEqual(["a", "b", "c"]);
  });
});

describe("appendStatusLogLine", () => {
  it("appends only the newest log line as a new <li>", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "Antwort", statusLog: ["a"] };
    const elements = renderStatusLog(turnEl as unknown as HTMLElement, turn);

    turn.statusLog!.push("b");
    appendStatusLogLine(elements, turn);

    expect(fake(elements.listEl).children.map((c) => c.text)).toEqual(["a", "b"]);
  });

  it("bumps the summary's step count to match the new log length", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "Antwort", statusLog: ["a"] };
    const elements = renderStatusLog(turnEl as unknown as HTMLElement, turn);

    turn.statusLog!.push("b");
    appendStatusLogLine(elements, turn);

    expect(fake(elements.summaryEl).text).toBe("Rechercheverlauf (2 Schritte)");
  });

  it("does nothing when statusLog is empty or missing", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "Antwort", statusLog: ["a"] };
    const elements = renderStatusLog(turnEl as unknown as HTMLElement, turn);

    const noLogTurn: ChatTurn = { role: "assistant", text: "Antwort" };
    appendStatusLogLine(elements, noLogTurn);

    expect(fake(elements.listEl).children).toHaveLength(1);
  });
});
