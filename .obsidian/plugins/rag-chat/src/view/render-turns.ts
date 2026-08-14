import { Component, type App } from "obsidian";
import type { ChatTurn } from "../retrieval/types";
import { fillTurn, type FilledTurn } from "./fill-turn";
import { appendStatusLogLine, renderStatusLog, type StatusLogElements } from "./render-status-log";
import { showsStatus, showsStreamingText } from "./turn-state";
import type { TurnActionCallbacks } from "./render-turn-actions";

export interface RenderTurnsResult {
  turnEls: Map<ChatTurn, HTMLElement>;
  turnContainers: Map<ChatTurn, HTMLElement>;
  statusLogElements: Map<ChatTurn, StatusLogElements>;
  markdownComponents: Map<ChatTurn, Component>;
}

const NEAR_BOTTOM_THRESHOLD_PX = 80;

function isNearBottom(messagesEl: HTMLElement): boolean {
  const el = messagesEl as unknown as { scrollTop: number; scrollHeight: number; clientHeight: number };
  return el.scrollHeight - (el.scrollTop + el.clientHeight) <= NEAR_BOTTOM_THRESHOLD_PX;
}

function storeFilled(result: RenderTurnsResult, turn: ChatTurn, filled: FilledTurn): void {
  result.turnEls.set(turn, filled.textEl);
  if (filled.statusLogElements) result.statusLogElements.set(turn, filled.statusLogElements);
  if (filled.markdownComponent) result.markdownComponents.set(turn, filled.markdownComponent);
}

function renderTurnInto(
  messagesEl: HTMLElement,
  turn: ChatTurn,
  app: App,
  component: Component,
  result: RenderTurnsResult,
  callbacks: TurnActionCallbacks,
): void {
  const turnEl = messagesEl.createDiv();
  result.turnContainers.set(turn, turnEl);
  storeFilled(result, turn, fillTurn(turnEl, turn, app, component, callbacks));
}

function emptyResult(): RenderTurnsResult {
  return {
    turnEls: new Map(),
    turnContainers: new Map(),
    statusLogElements: new Map(),
    markdownComponents: new Map(),
  };
}

export function renderTurns(
  messagesEl: HTMLElement,
  turns: ChatTurn[],
  app: App,
  component: Component,
  callbacks: TurnActionCallbacks = {},
): RenderTurnsResult {
  messagesEl.empty();
  const result = emptyResult();
  for (const turn of turns) {
    renderTurnInto(messagesEl, turn, app, component, result, callbacks);
  }
  messagesEl.scrollTo({ top: messagesEl.scrollHeight });
  return result;
}

export function appendNewTurns(
  messagesEl: HTMLElement,
  turns: ChatTurn[],
  app: App,
  component: Component,
  result: RenderTurnsResult,
  callbacks: TurnActionCallbacks = {},
): void {
  const newTurns = turns.filter((t) => !result.turnContainers.has(t));
  if (newTurns.length === 0) return;

  const wasNearBottom = isNearBottom(messagesEl);
  for (const turn of newTurns) {
    renderTurnInto(messagesEl, turn, app, component, result, callbacks);
  }
  if (wasNearBottom) messagesEl.scrollTo({ top: messagesEl.scrollHeight });
}

export function updateTurn(
  messagesEl: HTMLElement,
  turn: ChatTurn,
  app: App,
  component: Component,
  result: RenderTurnsResult,
  callbacks: TurnActionCallbacks = {},
): boolean {
  const turnEl = result.turnContainers.get(turn);
  if (!turnEl) return false;

  result.markdownComponents.get(turn)?.unload();
  result.markdownComponents.delete(turn);
  result.statusLogElements.delete(turn);

  const wasNearBottom = isNearBottom(messagesEl);
  storeFilled(result, turn, fillTurn(turnEl, turn, app, component, callbacks));
  if (wasNearBottom) messagesEl.scrollTo({ top: messagesEl.scrollHeight });
  return true;
}

export function updateTurnLive(turn: ChatTurn, result: RenderTurnsResult, messagesEl: HTMLElement): boolean {
  const streaming = showsStreamingText(turn);
  const status = !streaming && showsStatus(turn);
  if (!streaming && !status) return false;

  const turnEl = result.turnContainers.get(turn);
  const textEl = result.turnEls.get(turn);
  if (!turnEl || !textEl) return false;

  if (streaming) {
    textEl.removeClass("rag-chat-turn-status");
    textEl.addClass("rag-chat-turn-streaming");
    textEl.setText(turn.streamingText!);
  } else {
    textEl.removeClass("rag-chat-turn-streaming");
    textEl.addClass("rag-chat-turn-status");
    textEl.setText(turn.status!);
  }

  if (turn.steps && turn.steps.length > 0) {
    const wasNearBottom = isNearBottom(messagesEl);
    let statusLogElements = result.statusLogElements.get(turn);
    if (!statusLogElements) {
      statusLogElements = renderStatusLog(turnEl, turn);
      result.statusLogElements.set(turn, statusLogElements);
    } else {
      appendStatusLogLine(statusLogElements, turn);
    }
    if (wasNearBottom) messagesEl.scrollTo({ top: messagesEl.scrollHeight });
  }

  return true;
}

export function unloadAllTurns(result: RenderTurnsResult): void {
  for (const component of result.markdownComponents.values()) component.unload();
  result.markdownComponents.clear();
}
