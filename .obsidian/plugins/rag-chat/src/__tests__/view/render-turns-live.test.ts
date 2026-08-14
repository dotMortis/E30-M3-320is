import { describe, expect, it, vi } from "vitest";
import { Component } from "obsidian";
import { makeEl, type FakeElement } from "../mocks/dom";
import { fakeStep } from "../fixtures/pipeline-steps";
import type { ChatTurn } from "../../retrieval/types";
import { appendNewTurns, makeApp, renderTurns, unloadAllTurns, updateTurn, updateTurnLive } from "./render-turns-harness";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});


describe("updateTurnLive", () => {
  it("patches the status text in place without tearing down the turn element", () => {
    const messagesEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "", status: "Analysiere Frage …" };
    const result = renderTurns(messagesEl as unknown as HTMLElement, [turn], makeApp(), new Component());
    const originalTextEl = result.turnEls.get(turn);

    turn.status = "Erzeuge Such-Embedding …";
    const updated = updateTurnLive(turn, result, messagesEl as unknown as HTMLElement);

    expect(updated).toBe(true);
    expect(result.turnEls.get(turn)).toBe(originalTextEl);
    expect((originalTextEl as unknown as FakeElement)?.text).toBe("Erzeuge Such-Embedding …");
  });

  it("creates the status log on the first step and appends (not rebuilds) on later steps", () => {
    const messagesEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "", status: "Runde 1 …" };
    const result = renderTurns(messagesEl as unknown as HTMLElement, [turn], makeApp(), new Component());

    const step1 = fakeStep({ title: "Schritt 1" });
    turn.steps = [step1];
    updateTurnLive(turn, result, messagesEl as unknown as HTMLElement);
    const turnEl = messagesEl.children[0];
    expect(turnEl.querySelectorAll("details.rag-chat-status-log")).toHaveLength(1);
    expect(turnEl.querySelectorAll("li")).toHaveLength(1);

    const details = turnEl.querySelectorAll("details.rag-chat-status-log")[0];
    details.setAttribute("open", "true");

    const step2 = fakeStep({ title: "Schritt 2" });
    turn.steps = [step1, step2];
    updateTurnLive(turn, result, messagesEl as unknown as HTMLElement);

    expect(turnEl.querySelectorAll("details.rag-chat-status-log")).toHaveLength(1);
    expect(turnEl.querySelectorAll("li")).toHaveLength(2);
    expect(details.getAttribute("open")).toBe("true");
  });

  it("returns false once the turn has moved past the status phase (final text set)", () => {
    const messagesEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "", status: "Denke nach …" };
    const result = renderTurns(messagesEl as unknown as HTMLElement, [turn], makeApp(), new Component());

    turn.text = "Fertige Antwort.";
    turn.status = undefined;
    expect(updateTurnLive(turn, result, messagesEl as unknown as HTMLElement)).toBe(false);
  });

  it("returns false for a turn not yet rendered", () => {
    const messagesEl = makeEl("div");
    const result = renderTurns(messagesEl as unknown as HTMLElement, [], makeApp(), new Component());
    const strayTurn: ChatTurn = { role: "assistant", text: "", status: "…" };
    expect(updateTurnLive(strayTurn, result, messagesEl as unknown as HTMLElement)).toBe(false);
  });
});

