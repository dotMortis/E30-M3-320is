import { beforeEach, describe, expect, it, vi } from "vitest";
import { Component, type App } from "obsidian";
import { makeEl, type FakeElement } from "../mocks/dom";
import { createFakeWorkspace } from "../mocks/fake-app";
import { REFERENCE_BLOCK, TORQUE_BLOCK } from "../fixtures/context-blocks";
import type { ChatTurn } from "../../retrieval/types";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let renderTurns: typeof import("../../view/render-turns").renderTurns;
let appendNewTurns: typeof import("../../view/render-turns").appendNewTurns;
let updateTurn: typeof import("../../view/render-turns").updateTurn;
let unloadAllTurns: typeof import("../../view/render-turns").unloadAllTurns;

beforeEach(async () => {
  ({ renderTurns, appendNewTurns, updateTurn, unloadAllTurns } = await import("../../view/render-turns"));
});

function makeApp() {
  const workspace = createFakeWorkspace();
  return { workspace } as unknown as App;
}

describe("renderTurns", () => {
  it("renders plain text for a user turn without markdown processing", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "user", text: "Wie baue ich den Tank aus?" }];
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const turnEl = messagesEl.children[0];
    expect(turnEl.classes.has("rag-chat-turn-user")).toBe(true);
    const textEl = turnEl.children.find((c) => c.classes.has("rag-chat-turn-text"))!;
    expect(textEl.text).toBe("Wie baue ich den Tank aus?");
  });

  it("shows the transient status label instead of empty text for an in-progress assistant turn", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "assistant", text: "", status: "Durchsuche Handbuch …" }];
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const textEl = messagesEl.children[0].children.find((c) => c.classes.has("rag-chat-turn-text"))!;
    expect(textEl.classes.has("rag-chat-turn-status")).toBe(true);
    expect(textEl.text).toBe("Durchsuche Handbuch …");
  });

  it("renders an assistant turn's text through the linkify pipeline before markdown rendering", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "assistant", text: "Siehe [Seite 11-09].", citations: [TORQUE_BLOCK] }];
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const textEl = messagesEl.children[0].children.find((c) => c.classes.has("rag-chat-turn-text"))!;
    expect(textEl.text).toBe(`Siehe [Seite [[${TORQUE_BLOCK.notePath}|11-09]]].`);
  });

  it("renders a clarifying hint div for a paused ask_user turn", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "assistant", text: "Welches Baujahr?", isClarifying: true }];
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const turnEl = messagesEl.children[0];
    expect(turnEl.classes.has("rag-chat-turn-clarifying")).toBe(true);
    expect(turnEl.children.some((c) => c.classes.has("rag-chat-clarifying-hint"))).toBe(true);
  });

  it("does not render a clarifying hint for a normal completed turn", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "assistant", text: "Antwort" }];
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const turnEl = messagesEl.children[0];
    expect(turnEl.children.some((c) => c.classes.has("rag-chat-clarifying-hint"))).toBe(false);
  });

  it("composes web + manual + reference citation linkification correctly on one combined turn (ordering interaction)", () => {
    const messagesEl = makeEl("div");
    // linkifyWebCitations wraps the whole *line* containing the grounding
    // support's startIndex, so this needs separate lines to keep the web
    // citation from swallowing the [Seite ...]/[Referenz: ...] brackets too.
    const text = "Zylinderkopf: 30 Nm [Seite 11-09].\nWerkzeug: [Referenz: Sonderwerkzeuge].\nMehr Infos online.";
    const snippetStart = text.indexOf("Mehr Infos online.");
    const snippetEnd = snippetStart + "Mehr Infos online.".length;
    const turns: ChatTurn[] = [
      {
        role: "assistant",
        text,
        citations: [TORQUE_BLOCK, REFERENCE_BLOCK],
        webGroundingChunks: [{ uri: "https://example.com", title: "Example" }],
        webGroundingSupports: [{ startIndex: snippetStart, endIndex: snippetEnd, chunkIndices: [0], text: "excerpt" }],
      },
    ];
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const textEl = messagesEl.children[0].children.find((c) => c.classes.has("rag-chat-turn-text"))!;
    expect(textEl.text).toContain(`[Seite [[${TORQUE_BLOCK.notePath}|11-09]]]`);
    expect(textEl.text).toContain(`[Referenz: [[${REFERENCE_BLOCK.notePath}|Sonderwerkzeuge]]]`);
    expect(textEl.text).toContain("[Mehr Infos online.](https://example.com)");
  });

  it("renders manual citation links below the text when citations are present", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "assistant", text: "Antwort", citations: [TORQUE_BLOCK] }];
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const turnEl = messagesEl.children[0];
    expect(turnEl.querySelectorAll("a.rag-chat-citation-link")).toHaveLength(1);
  });

  it("renders the status log block when the turn has accumulated status lines", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "assistant", text: "Antwort", statusLog: ["Schritt 1"] }];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const turnEl = messagesEl.children[0];
    expect(turnEl.querySelectorAll("details.rag-chat-status-log")).toHaveLength(1);
    expect(result.statusLogElements.has(turns[0])).toBe(true);
  });

  it("does not render a status log block when statusLog is empty or absent", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "assistant", text: "Antwort" }];
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const turnEl = messagesEl.children[0];
    expect(turnEl.querySelectorAll("details.rag-chat-status-log")).toHaveLength(0);
  });

  it("maps each turn to its own text element in the returned turnEls map", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [
      { role: "user", text: "Frage 1" },
      { role: "assistant", text: "Antwort 1" },
    ];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    expect((result.turnEls.get(turns[0]) as unknown as FakeElement)?.text).toBe("Frage 1");
    expect((result.turnEls.get(turns[1]) as unknown as FakeElement)?.text).toBe("Antwort 1");
  });

  it("clears any previously rendered turns before rendering the new list", () => {
    const messagesEl = makeEl("div");
    renderTurns(messagesEl as unknown as HTMLElement, [{ role: "user", text: "Erste" }], makeApp(), new Component());
    renderTurns(messagesEl as unknown as HTMLElement, [{ role: "user", text: "Zweite" }], makeApp(), new Component());
    expect(messagesEl.children).toHaveLength(1);
    expect(messagesEl.children[0].children.find((c) => c.classes.has("rag-chat-turn-text"))?.text).toBe("Zweite");
  });

  it("renders each turn in the same order as the input array", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [
      { role: "user", text: "erste" },
      { role: "assistant", text: "zweite" },
      { role: "user", text: "dritte" },
    ];
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const texts = messagesEl.children.map((c) => c.children.find((child) => child.classes.has("rag-chat-turn-text"))?.text);
    expect(texts).toEqual(["erste", "zweite", "dritte"]);
  });
});

describe("appendNewTurns", () => {
  it("appends only turns not already in the result, leaving existing turn elements untouched", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "user", text: "Erste" }];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const firstTurnEl = result.turnContainers.get(turns[0]);

    turns.push({ role: "assistant", text: "Zweite" });
    appendNewTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component(), result);

    expect(messagesEl.children).toHaveLength(2);
    expect(result.turnContainers.get(turns[0])).toBe(firstTurnEl);
    expect((result.turnEls.get(turns[1]) as unknown as FakeElement)?.text).toBe("Zweite");
  });

  it("does not collapse an expanded <details> status-log on an earlier turn when a new turn is appended", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "assistant", text: "Antwort", statusLog: ["Schritt 1"] }];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const details = messagesEl.children[0].querySelectorAll("details.rag-chat-status-log")[0];
    details.setAttribute("open", "true"); // simulate the user having expanded it

    turns.push({ role: "user", text: "Neue Frage" });
    appendNewTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component(), result);

    expect(details.getAttribute("open")).toBe("true");
  });

  it("is a no-op when there are no new turns", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "user", text: "Erste" }];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    appendNewTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component(), result);
    expect(messagesEl.children).toHaveLength(1);
  });

  it("scrolls to bottom when the user was already near the bottom", () => {
    const messagesEl = makeEl("div") as unknown as FakeElement & HTMLElement;
    const turns: ChatTurn[] = [{ role: "user", text: "Erste" }];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    (messagesEl as unknown as FakeElement).scrollHeight = 100;
    (messagesEl as unknown as FakeElement).clientHeight = 100;
    (messagesEl as unknown as FakeElement).scrollTop = 0; // scrollHeight - (scrollTop+clientHeight) = 0 <= threshold

    turns.push({ role: "assistant", text: "Zweite" });
    appendNewTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component(), result);

    expect((messagesEl as unknown as FakeElement).scrollTop).toBe((messagesEl as unknown as FakeElement).scrollHeight);
  });

  it("does not yank scroll position when the user has scrolled up away from the bottom", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "user", text: "Erste" }];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    messagesEl.scrollHeight = 1000;
    messagesEl.clientHeight = 100;
    messagesEl.scrollTop = 50; // far from bottom: 1000 - (50+100) = 850 > threshold

    turns.push({ role: "assistant", text: "Zweite" });
    appendNewTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component(), result);

    expect(messagesEl.scrollTop).toBe(50);
  });
});

describe("updateTurn", () => {
  it("re-renders the given turn's content in place, reusing the same outer element", () => {
    const messagesEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "", status: "Denke nach …" };
    const turns: ChatTurn[] = [turn];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const originalEl = result.turnContainers.get(turn);

    turn.text = "Fertige Antwort.";
    turn.status = undefined;
    const updated = updateTurn(messagesEl as unknown as HTMLElement, turn, makeApp(), new Component(), result);

    expect(updated).toBe(true);
    expect(result.turnContainers.get(turn)).toBe(originalEl);
    expect((result.turnEls.get(turn) as unknown as FakeElement)?.text).toBe("Fertige Antwort.");
  });

  it("returns false and does nothing for a turn not yet in the result", () => {
    const messagesEl = makeEl("div");
    const result = renderTurns(messagesEl as unknown as HTMLElement, [], makeApp(), new Component());
    const strayTurn: ChatTurn = { role: "assistant", text: "x" };
    expect(updateTurn(messagesEl as unknown as HTMLElement, strayTurn, makeApp(), new Component(), result)).toBe(false);
  });

  it("does not touch a different turn's expanded <details> status-log", () => {
    const messagesEl = makeEl("div");
    const turnA: ChatTurn = { role: "assistant", text: "A", statusLog: ["a1"] };
    const turnB: ChatTurn = { role: "assistant", text: "", status: "..." };
    const turns: ChatTurn[] = [turnA, turnB];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const detailsA = messagesEl.children[0].querySelectorAll("details.rag-chat-status-log")[0];
    detailsA.setAttribute("open", "true");

    turnB.text = "B fertig";
    turnB.status = undefined;
    updateTurn(messagesEl as unknown as HTMLElement, turnB, makeApp(), new Component(), result);

    expect(detailsA.getAttribute("open")).toBe("true");
  });

  it("unloads the previous markdown-rendering component for that turn before re-rendering", () => {
    const messagesEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "Erste Version", citations: [] };
    const turns: ChatTurn[] = [turn];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const firstComponent = result.markdownComponents.get(turn);
    const unloadSpy = firstComponent ? vi.spyOn(firstComponent, "unload") : undefined;

    turn.text = "Zweite Version";
    updateTurn(messagesEl as unknown as HTMLElement, turn, makeApp(), new Component(), result);

    expect(unloadSpy).toHaveBeenCalled();
  });
});

describe("unloadAllTurns", () => {
  it("unloads every turn's markdown component and clears the map", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [
      { role: "assistant", text: "Antwort 1" },
      { role: "assistant", text: "Antwort 2" },
    ];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const components = [...result.markdownComponents.values()];
    const unloadSpies = components.map((c) => vi.spyOn(c, "unload"));

    unloadAllTurns(result);

    for (const spy of unloadSpies) expect(spy).toHaveBeenCalled();
    expect(result.markdownComponents.size).toBe(0);
  });
});
