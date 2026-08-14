import { Component, MarkdownRenderer, type App } from "obsidian";
import { linkifyCitations } from "../citations/page-citations";
import { linkifyReferenceCitations } from "../citations/reference-citations";
import { linkifyWebCitations } from "../citations/web-citations";
import type { ChatTurn } from "../retrieval/types";
import { renderManualCitations, renderWebCitations } from "./render-citations";
import { renderStatusLog, showsStatus, type StatusLogElements } from "./render-status-log";
import { wireInternalLinks } from "./wire-links";

export interface RenderTurnsResult {
  /** Maps each turn to its own *text* element (not the outer turn container). */
  turnEls: Map<ChatTurn, HTMLElement>;
  /** Maps each turn to its outer turn-container element, for incremental updates. */
  turnContainers: Map<ChatTurn, HTMLElement>;
  statusLogElements: Map<ChatTurn, StatusLogElements>;
  /** The Component scoping each turn's rendered Markdown, so it can be
   * unloaded (cleaning up any nested child components/listeners) before a
   * re-render of that same turn. */
  markdownComponents: Map<ChatTurn, Component>;
}

const NEAR_BOTTOM_THRESHOLD_PX = 80;

function isNearBottom(messagesEl: HTMLElement): boolean {
  const el = messagesEl as unknown as { scrollTop: number; scrollHeight: number; clientHeight: number };
  return el.scrollHeight - (el.scrollTop + el.clientHeight) <= NEAR_BOTTOM_THRESHOLD_PX;
}

/**
 * Renders one turn's full content (status/text/clarifying hint/citations/
 * status-log) into `turnEl`, which must already be created (and, for an
 * update, already attached to the DOM at its existing position). Any
 * previous Markdown-rendering component for this turn must be unloaded by
 * the caller first.
 */
function fillTurn(
  turnEl: HTMLElement,
  turn: ChatTurn,
  app: App,
  parentComponent: Component
): { textEl: HTMLElement; statusLogElements?: StatusLogElements; markdownComponent?: Component } {
  turnEl.empty();
  const cls = ["rag-chat-turn", `rag-chat-turn-${turn.role}`];
  if (turn.isClarifying) cls.push("rag-chat-turn-clarifying");
  for (const c of cls) turnEl.addClass(c);

  const status = showsStatus(turn);
  const textEl = turnEl.createDiv({ cls: status ? "rag-chat-turn-text rag-chat-turn-status" : "rag-chat-turn-text" });

  let markdownComponent: Component | undefined;
  if (status) {
    textEl.setText(turn.status!);
  } else if (turn.role === "assistant" && turn.text) {
    const withWebLinks = linkifyWebCitations(turn.text, turn.webGroundingChunks ?? [], turn.webGroundingSupports ?? []);
    const withManualLinks = linkifyCitations(withWebLinks, turn.citations ?? []);
    const renderedText = linkifyReferenceCitations(withManualLinks, turn.citations ?? []);
    markdownComponent = new Component();
    parentComponent.addChild(markdownComponent);
    const scopedComponent = markdownComponent;
    void MarkdownRenderer.render(app, renderedText, textEl, "", scopedComponent).then(() => {
      wireInternalLinks(textEl, app, scopedComponent);
    });
  } else {
    textEl.setText(turn.text);
  }

  if (turn.isClarifying) {
    turnEl.createDiv({ cls: "rag-chat-clarifying-hint", text: "Antworte unten, um fortzufahren." });
  }

  renderManualCitations(turnEl, turn, app, parentComponent);
  renderWebCitations(turnEl, turn);

  let statusLogElements: StatusLogElements | undefined;
  if (turn.steps && turn.steps.length > 0) {
    statusLogElements = renderStatusLog(turnEl, turn);
  }

  return { textEl, statusLogElements, markdownComponent };
}

/** Full rebuild: clears `messagesEl` and renders every turn from scratch.
 * Used for the initial mount (and other full resets, e.g. "clear chat").
 * For incremental updates once turns are already rendered, use
 * `appendTurns`/`updateTurn` instead - re-running this on every message
 * causes O(n^2) growth and collapses any expanded `<details>` elements. */
export function renderTurns(messagesEl: HTMLElement, turns: ChatTurn[], app: App, component: Component): RenderTurnsResult {
  messagesEl.empty();
  const result: RenderTurnsResult = {
    turnEls: new Map(),
    turnContainers: new Map(),
    statusLogElements: new Map(),
    markdownComponents: new Map(),
  };

  for (const turn of turns) {
    const turnEl = messagesEl.createDiv();
    const { textEl, statusLogElements, markdownComponent } = fillTurn(turnEl, turn, app, component);
    result.turnContainers.set(turn, turnEl);
    result.turnEls.set(turn, textEl);
    if (statusLogElements) result.statusLogElements.set(turn, statusLogElements);
    if (markdownComponent) result.markdownComponents.set(turn, markdownComponent);
  }

  messagesEl.scrollTo({ top: messagesEl.scrollHeight });
  return result;
}

/**
 * Appends any turns not yet present in `result` to the end of `messagesEl`,
 * mutating `result`'s maps in place. Existing turns' elements are left
 * completely untouched (so expanded `<details>` elsewhere in the
 * conversation don't collapse). Only auto-scrolls if the user was already
 * near the bottom before the append.
 */
export function appendNewTurns(messagesEl: HTMLElement, turns: ChatTurn[], app: App, component: Component, result: RenderTurnsResult): void {
  const newTurns = turns.filter((t) => !result.turnContainers.has(t));
  if (newTurns.length === 0) return;

  const wasNearBottom = isNearBottom(messagesEl);
  for (const turn of newTurns) {
    const turnEl = messagesEl.createDiv();
    const { textEl, statusLogElements, markdownComponent } = fillTurn(turnEl, turn, app, component);
    result.turnContainers.set(turn, turnEl);
    result.turnEls.set(turn, textEl);
    if (statusLogElements) result.statusLogElements.set(turn, statusLogElements);
    if (markdownComponent) result.markdownComponents.set(turn, markdownComponent);
  }
  if (wasNearBottom) messagesEl.scrollTo({ top: messagesEl.scrollHeight });
}

/**
 * Re-renders a single already-rendered turn's content in place (its outer
 * container element is reused, not recreated), updating `result`'s maps for
 * that turn. Used when a turn's content changes after its initial render
 * (e.g. a status update, or the final answer replacing the in-progress
 * status). No-op if the turn isn't in `result` yet - callers should fall
 * back to `appendNewTurns` in that case.
 */
export function updateTurn(messagesEl: HTMLElement, turn: ChatTurn, app: App, component: Component, result: RenderTurnsResult): boolean {
  const turnEl = result.turnContainers.get(turn);
  if (!turnEl) return false;

  result.markdownComponents.get(turn)?.unload();
  result.markdownComponents.delete(turn);
  result.statusLogElements.delete(turn);

  const wasNearBottom = isNearBottom(messagesEl);
  const { textEl, statusLogElements, markdownComponent } = fillTurn(turnEl, turn, app, component);
  result.turnEls.set(turn, textEl);
  if (statusLogElements) result.statusLogElements.set(turn, statusLogElements);
  if (markdownComponent) result.markdownComponents.set(turn, markdownComponent);
  if (wasNearBottom) messagesEl.scrollTo({ top: messagesEl.scrollHeight });
  return true;
}

/** Unloads every turn's Markdown-rendering component. Call before clearing
 * or replacing the whole conversation (e.g. "clear chat", view teardown). */
export function unloadAllTurns(result: RenderTurnsResult): void {
  for (const component of result.markdownComponents.values()) component.unload();
  result.markdownComponents.clear();
}
