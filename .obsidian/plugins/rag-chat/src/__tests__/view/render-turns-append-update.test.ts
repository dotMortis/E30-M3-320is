import { describe, expect, it, vi } from "vitest";
import { Component } from "obsidian";
import { makeEl, type FakeElement } from "../mocks/dom";
import { fakeStep } from "../fixtures/pipeline-steps";
import type { ChatTurn } from "../../retrieval/types";
import { appendNewTurns, makeApp, renderTurns, updateTurn } from "./render-turns-harness";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
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
    const turns: ChatTurn[] = [{ role: "assistant", text: "Antwort", steps: [fakeStep({ title: "Schritt 1" })] }];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const details = messagesEl.children[0].querySelectorAll("details.rag-chat-status-log")[0];
    details.setAttribute("open", "true");

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
    (messagesEl as unknown as FakeElement).scrollTop = 0;

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
    messagesEl.scrollTop = 50;

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
    const turnA: ChatTurn = { role: "assistant", text: "A", steps: [fakeStep({ title: "a1" })] };
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

