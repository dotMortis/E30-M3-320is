import { describe, expect, it } from "vitest";
import { makeEl, type FakeElement } from "../mocks/dom";
import { appendStatusLogLine, renderStatusLog, showsStatus } from "../../view/render-status-log";
import { fakeStep } from "../fixtures/pipeline-steps";
import type { ChatTurn } from "../../retrieval/types";

function fake(el: HTMLElement): FakeElement {
  return el as unknown as FakeElement;
}
describe("appendStatusLogLine", () => {
  it("appends a newly added step as a new list item", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "Antwort", steps: [fakeStep({ title: "a" })] };
    const elements = renderStatusLog(turnEl as unknown as HTMLElement, turn);

    turn.steps!.push(fakeStep({ title: "b" }));
    appendStatusLogLine(elements, turn);

    const titles = fake(elements.listEl)
      .querySelectorAll("span.rag-chat-step-title")
      .map((el) => el.text);
    expect(titles).toEqual(["a", "b"]);
  });

  it("re-renders an already-rendered step in place when it is mutated (e.g. running -> done)", () => {
    const turnEl = makeEl("div");
    const step = fakeStep({ title: "wird ausgeführt …", status: "running" });
    const turn: ChatTurn = { role: "assistant", text: "Antwort", steps: [step] };
    const elements = renderStatusLog(turnEl as unknown as HTMLElement, turn);

    step.title = "fertig";
    step.status = "done";
    appendStatusLogLine(elements, turn);

    expect(fake(elements.listEl).querySelectorAll("li")).toHaveLength(1);
    expect(fake(elements.listEl).querySelector("span.rag-chat-step-title")?.text).toBe("fertig");
  });

  it("bumps the summary's step count to match the new step count", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "Antwort", steps: [fakeStep()] };
    const elements = renderStatusLog(turnEl as unknown as HTMLElement, turn);

    turn.steps!.push(fakeStep());
    appendStatusLogLine(elements, turn);

    expect(fake(elements.summaryEl).text).toBe("Rechercheverlauf (2 Schritte)");
  });

  it("does nothing when steps is empty or missing", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "Antwort", steps: [fakeStep()] };
    const elements = renderStatusLog(turnEl as unknown as HTMLElement, turn);

    const noStepsTurn: ChatTurn = { role: "assistant", text: "Antwort" };
    appendStatusLogLine(elements, noStepsTurn);

    expect(fake(elements.listEl).children).toHaveLength(1);
  });
});
