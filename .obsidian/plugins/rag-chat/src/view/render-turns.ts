import { MarkdownRenderer, type App, type Component } from "obsidian";
import { linkifyCitations } from "../citations/page-citations";
import { linkifyReferenceCitations } from "../citations/reference-citations";
import { linkifyWebCitations } from "../citations/web-citations";
import type { ChatTurn } from "../retrieval/types";
import { renderManualCitations, renderWebCitations } from "./render-citations";
import { renderStatusLog, showsStatus, type StatusLogElements } from "./render-status-log";
import { wireInternalLinks } from "./wire-links";

export interface RenderTurnsResult {
  turnEls: Map<ChatTurn, HTMLElement>;
  statusLogElements: Map<ChatTurn, StatusLogElements>;
}

export function renderTurns(messagesEl: HTMLElement, turns: ChatTurn[], app: App, component: Component): RenderTurnsResult {
  messagesEl.empty();
  const turnEls = new Map<ChatTurn, HTMLElement>();
  const statusLogElements = new Map<ChatTurn, StatusLogElements>();

  for (const turn of turns) {
    const cls = ["rag-chat-turn", `rag-chat-turn-${turn.role}`];
    if (turn.isClarifying) cls.push("rag-chat-turn-clarifying");
    const turnEl = messagesEl.createDiv({ cls: cls.join(" ") });

    const status = showsStatus(turn);
    const textEl = turnEl.createDiv({ cls: status ? "rag-chat-turn-text rag-chat-turn-status" : "rag-chat-turn-text" });
    turnEls.set(turn, textEl);

    if (status) {
      textEl.setText(turn.status!);
    } else if (turn.role === "assistant" && turn.text) {
      const withWebLinks = linkifyWebCitations(turn.text, turn.webGroundingChunks ?? [], turn.webGroundingSupports ?? []);
      const withManualLinks = linkifyCitations(withWebLinks, turn.citations ?? []);
      const renderedText = linkifyReferenceCitations(withManualLinks, turn.citations ?? []);
      void MarkdownRenderer.render(app, renderedText, textEl, "", component).then(() => {
        wireInternalLinks(textEl, app);
      });
    } else {
      textEl.setText(turn.text);
    }

    if (turn.isClarifying) {
      turnEl.createDiv({ cls: "rag-chat-clarifying-hint", text: "Antworte unten, um fortzufahren." });
    }

    renderManualCitations(turnEl, turn, app);
    renderWebCitations(turnEl, turn);

    if (turn.statusLog && turn.statusLog.length > 0) {
      statusLogElements.set(turn, renderStatusLog(turnEl, turn));
    }
  }

  messagesEl.scrollTo({ top: messagesEl.scrollHeight });
  return { turnEls, statusLogElements };
}
