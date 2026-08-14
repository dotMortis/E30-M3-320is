import { describe, expect, it, vi } from "vitest";
import { Component } from "obsidian";
import { makeEl, type FakeElement } from "../mocks/dom";
import { REFERENCE_BLOCK, TORQUE_BLOCK } from "../fixtures/context-blocks";
import { fakeStep } from "../fixtures/pipeline-steps";
import type { ChatTurn } from "../../retrieval/types";
import { makeApp, renderTurns } from "./render-turns-harness";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});


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
    const turns: ChatTurn[] = [{ role: "assistant", text: "Antwort", steps: [fakeStep({ title: "Schritt 1" })] }];
    const result = renderTurns(messagesEl as unknown as HTMLElement, turns, makeApp(), new Component());
    const turnEl = messagesEl.children[0];
    expect(turnEl.querySelectorAll("details.rag-chat-status-log")).toHaveLength(1);
    expect(result.statusLogElements.has(turns[0])).toBe(true);
  });

  it("does not render a status log block when steps is empty or absent", () => {
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

