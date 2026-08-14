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

describe("turn actions", () => {
  it("renders a copy button for a turn with real text", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "assistant", text: "Antwort" }];
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const turnEl = messagesEl.children[0];
    expect(turnEl.querySelectorAll("button.rag-chat-copy-button")).toHaveLength(1);
  });

  it("does not render a copy button for an in-progress status turn", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "assistant", text: "", status: "Denke nach …" }];
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const turnEl = messagesEl.children[0];
    expect(turnEl.querySelectorAll("button.rag-chat-copy-button")).toHaveLength(0);
  });

  it("does not render retry/delete buttons for a successful turn", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "assistant", text: "Antwort" }];
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const turnEl = messagesEl.children[0];
    expect(turnEl.querySelectorAll("button.rag-chat-retry-button")).toHaveLength(0);
    expect(turnEl.querySelectorAll("button.rag-chat-delete-button")).toHaveLength(0);
  });

  it("renders retry and delete buttons for a failed turn and wires them to the callbacks", () => {
    const messagesEl = makeEl("div");
    const failedTurn: ChatTurn = {
      role: "assistant",
      text: "Fehler: boom",
      retry: { message: "Frage?", pendingBefore: null },
    };
    const turns: ChatTurn[] = [failedTurn];
    const onRetry = vi.fn();
    const onDelete = vi.fn();
    renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component(), { onRetry, onDelete });
    const turnEl = messagesEl.children[0];

    const retryButton = turnEl.querySelectorAll("button.rag-chat-retry-button")[0];
    const deleteButton = turnEl.querySelectorAll("button.rag-chat-delete-button")[0];
    expect(retryButton).toBeDefined();
    expect(deleteButton).toBeDefined();

    retryButton.dispatch("click");
    deleteButton.dispatch("click");

    expect(onRetry).toHaveBeenCalledWith(failedTurn);
    expect(onDelete).toHaveBeenCalledWith(failedTurn);
  });

  it("forwards callbacks through appendNewTurns and updateTurn", () => {
    const messagesEl = makeEl("div");
    const turns: ChatTurn[] = [{ role: "user", text: "Frage" }];
    const onRetry = vi.fn();
    const onDelete = vi.fn();
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component(), { onRetry, onDelete });

    const failedTurn: ChatTurn = { role: "assistant", text: "Fehler: boom", retry: { message: "Frage", pendingBefore: null } };
    turns.push(failedTurn);
    appendNewTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component(), result, { onRetry, onDelete });
    let retryButton = messagesEl.children[1].querySelectorAll("button.rag-chat-retry-button")[0];
    retryButton.dispatch("click");
    expect(onRetry).toHaveBeenCalledWith(failedTurn);

    failedTurn.text = "Fehler: boom again";
    updateTurn(messagesEl as unknown as HTMLElement, failedTurn, makeApp(), new Component(), result, { onRetry, onDelete });
    retryButton = messagesEl.children[1].querySelectorAll("button.rag-chat-retry-button")[0];
    retryButton.dispatch("click");
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});
