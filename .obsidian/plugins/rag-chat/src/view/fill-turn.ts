import { Component, MarkdownRenderer, type App } from "obsidian";
import { linkifyCitations } from "../citations/page-citations";
import { linkifyReferenceCitations } from "../citations/reference-citations";
import { linkifyWebCitations } from "../citations/web-citations";
import type { ChatTurn } from "../retrieval/types";
import { renderManualCitations, renderWebCitations } from "./render-citations";
import { renderStatusLog, type StatusLogElements } from "./render-status-log";
import { renderTurnActions, type TurnActionCallbacks } from "./render-turn-actions";
import { showsStatus, showsStreamingText } from "./turn-state";
import { wireInternalLinks } from "./wire-links";

export interface FilledTurn {
  textEl: HTMLElement;
  statusLogElements?: StatusLogElements;
  markdownComponent?: Component;
}

function textElClass(streaming: boolean, status: boolean): string {
  if (streaming) return "rag-chat-turn-text rag-chat-turn-streaming";
  if (status) return "rag-chat-turn-text rag-chat-turn-status";
  return "rag-chat-turn-text";
}

function renderAnswerMarkdown(
  textEl: HTMLElement,
  turn: ChatTurn,
  app: App,
  parentComponent: Component,
): Component {
  const withWebLinks = linkifyWebCitations(turn.text, turn.webGroundingChunks ?? [], turn.webGroundingSupports ?? []);
  const withManualLinks = linkifyCitations(withWebLinks, turn.citations ?? []);
  const renderedText = linkifyReferenceCitations(withManualLinks, turn.citations ?? []);
  const markdownComponent = new Component();
  parentComponent.addChild(markdownComponent);
  void MarkdownRenderer.render(app, renderedText, textEl, "", markdownComponent).then(() => {
    wireInternalLinks(textEl, app, markdownComponent);
  });
  return markdownComponent;
}

export function fillTurn(
  turnEl: HTMLElement,
  turn: ChatTurn,
  app: App,
  parentComponent: Component,
  callbacks: TurnActionCallbacks,
): FilledTurn {
  turnEl.empty();
  turnEl.addClass("rag-chat-turn");
  turnEl.addClass(`rag-chat-turn-${turn.role}`);
  if (turn.isClarifying) turnEl.addClass("rag-chat-turn-clarifying");

  const streaming = showsStreamingText(turn);
  const status = !streaming && showsStatus(turn);
  const textEl = turnEl.createDiv({ cls: textElClass(streaming, status) });

  let markdownComponent: Component | undefined;
  if (streaming) {
    textEl.setText(turn.streamingText!);
  } else if (status) {
    textEl.setText(turn.status!);
  } else if (turn.role === "assistant" && turn.text) {
    markdownComponent = renderAnswerMarkdown(textEl, turn, app, parentComponent);
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

  renderTurnActions(turnEl, turn, parentComponent, callbacks);

  return { textEl, statusLogElements, markdownComponent };
}
