import { describe, expect, it } from "vitest";
import { makeEl, type FakeElement } from "../mocks/dom";
import { appendStatusLogLine, renderStatusLog, showsStatus } from "../../view/render-status-log";
import { fakeStep } from "../fixtures/pipeline-steps";
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
    const turn: ChatTurn = { role: "assistant", text: "Antwort", steps: [fakeStep(), fakeStep()] };
    const { summaryEl } = renderStatusLog(turnEl as unknown as HTMLElement, turn);
    expect(fake(summaryEl).text).toBe("Rechercheverlauf (2 Schritte)");
  });

  it("renders one list item per step, in order, showing the step's title", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = {
      role: "assistant",
      text: "Antwort",
      steps: [fakeStep({ title: "a" }), fakeStep({ title: "b" }), fakeStep({ title: "c" })],
    };
    const { listEl } = renderStatusLog(turnEl as unknown as HTMLElement, turn);
    const titles = fake(listEl)
      .querySelectorAll("span.rag-chat-step-title")
      .map((el) => el.text);
    expect(titles).toEqual(["a", "b", "c"]);
  });

  it("shows the step's kind label, model, round and duration", () => {
    const turnEl = makeEl("div");
    const step = fakeStep({
      kind: "embedding",
      title: "Such-Embedding erzeugt",
      model: "gemini-embedding-2",
      round: 2,
      startedAt: 1000,
      finishedAt: 1500,
      durationMs: 500,
    });
    const turn: ChatTurn = { role: "assistant", text: "Antwort", steps: [step] };
    const { listEl } = renderStatusLog(turnEl as unknown as HTMLElement, turn);
    expect(fake(listEl).querySelector("span.rag-chat-step-kind")?.text).toBe("Embedding");
    expect(fake(listEl).querySelector("span.rag-chat-step-model")?.text).toBe("Modell: gemini-embedding-2");
    expect(fake(listEl).querySelector("span.rag-chat-step-round")?.text).toBe("Runde 2");
    expect(fake(listEl).querySelector("span.rag-chat-step-duration")?.text).toBe("500ms");
  });

  it("shows the narration text when present", () => {
    const turnEl = makeEl("div");
    const step = fakeStep({ narration: "3 Treffer gefunden: Tank [16-01]." });
    const turn: ChatTurn = { role: "assistant", text: "Antwort", steps: [step] };
    const { listEl } = renderStatusLog(turnEl as unknown as HTMLElement, turn);
    expect(fake(listEl).querySelector("div.rag-chat-step-narration")?.text).toBe("3 Treffer gefunden: Tank [16-01].");
  });

  it("renders the error message and auto-opens the details for a failed step", () => {
    const turnEl = makeEl("div");
    const step = fakeStep({ status: "error", errorMessage: "query darf nicht leer sein." });
    const turn: ChatTurn = { role: "assistant", text: "Antwort", steps: [step] };
    const { listEl } = renderStatusLog(turnEl as unknown as HTMLElement, turn);
    expect(fake(listEl).querySelector("div.rag-chat-step-error")?.text).toBe("query darf nicht leer sein.");
    expect(fake(listEl).querySelector("details.rag-chat-step-details")?.getAttribute("open")).toBe("");
  });

  it("renders tool args and result as nested collapsible JSON blocks", () => {
    const turnEl = makeEl("div");
    const step = fakeStep({
      kind: "tool_call",
      toolArgs: { query: "Bremse" },
      toolResult: { hits: [] },
    });
    const turn: ChatTurn = { role: "assistant", text: "Antwort", steps: [step] };
    const { listEl } = renderStatusLog(turnEl as unknown as HTMLElement, turn);
    const jsonBlocks = fake(listEl).querySelectorAll("details.rag-chat-step-json");
    expect(jsonBlocks).toHaveLength(2);
    expect(jsonBlocks[0].querySelectorAll("pre")[0].text).toContain("Bremse");
    expect(jsonBlocks[1].querySelectorAll("pre")[0].text).toContain("hits");
  });

  it("renders the retrieval hit list when present", () => {
    const turnEl = makeEl("div");
    const step = fakeStep({
      kind: "retrieval",
      hits: [{ seitencode: "16-01", sektion: "Kraftstoff", titel: "Tank", score: 0.812 }],
    });
    const turn: ChatTurn = { role: "assistant", text: "Antwort", steps: [step] };
    const { listEl } = renderStatusLog(turnEl as unknown as HTMLElement, turn);
    const hitsList = fake(listEl).querySelectorAll("ul.rag-chat-step-hits")[0];
    const hitItems = hitsList.querySelectorAll("li");
    expect(hitItems).toHaveLength(1);
    expect(hitItems[0].text).toBe("Tank [16-01] (0.81)");
  });
});

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
