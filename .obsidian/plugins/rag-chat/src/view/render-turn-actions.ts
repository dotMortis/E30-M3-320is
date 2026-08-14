import { setIcon, type Component } from "obsidian";
import type { ChatTurn } from "../retrieval/types";
import { copyToClipboard } from "./clipboard";
import { showsStatus } from "./render-status-log";

export interface TurnActionCallbacks {
  onRetry?: (turn: ChatTurn) => void;
  onDelete?: (turn: ChatTurn) => void;

  onSpeak?: (turn: ChatTurn) => void;

  isSpeaking?: (turn: ChatTurn) => boolean;
}

const COPY_ICON_RESET_MS = 1500;

export function renderTurnActions(
  turnEl: HTMLElement,
  turn: ChatTurn,
  component: Component,
  callbacks: TurnActionCallbacks
): void {
  const canCopy = turn.text.length > 0 && !showsStatus(turn);
  if (!canCopy && !turn.retry) return;

  const actionsEl = turnEl.createDiv({ cls: "rag-chat-turn-actions" });

  if (canCopy) {
    const copyButton = actionsEl.createEl("button", {
      cls: "rag-chat-action-button rag-chat-copy-button",
      attr: { "aria-label": "In Zwischenablage kopieren" },
    });
    setIcon(copyButton, "copy");
    component.registerDomEvent(copyButton, "click", () => {
      void copyToClipboard(turn.text).then((ok) => {
        setIcon(copyButton, ok ? "check" : "x");
        setTimeout(() => setIcon(copyButton, "copy"), COPY_ICON_RESET_MS);
      });
    });
  }

  const canSpeak = turn.role === "assistant" && !turn.isClarifying && canCopy;
  if (canSpeak) {
    const speaking = callbacks.isSpeaking?.(turn) ?? false;
    const speakButton = actionsEl.createEl("button", {
      cls: "rag-chat-action-button rag-chat-tts-button",
      attr: { "aria-label": speaking ? "Wiedergabe stoppen" : "Antwort vorlesen" },
    });
    if (turn.ttsStatus === "generating") {
      speakButton.disabled = true;
      speakButton.addClass("rag-chat-tts-button-loading");
      setIcon(speakButton, "loader-2");
    } else if (speaking) {
      speakButton.addClass("rag-chat-tts-button-playing");
      setIcon(speakButton, "square");
    } else if (turn.ttsStatus === "error") {
      speakButton.addClass("rag-chat-tts-button-error");
      setIcon(speakButton, "volume-2");
    } else {
      setIcon(speakButton, "volume-2");
    }
    component.registerDomEvent(speakButton, "click", () => callbacks.onSpeak?.(turn));
  }

  if (turn.retry) {
    const retryButton = actionsEl.createEl("button", {
      cls: "rag-chat-action-button rag-chat-retry-button",
      text: "Erneut versuchen",
    });
    component.registerDomEvent(retryButton, "click", () => callbacks.onRetry?.(turn));

    const deleteButton = actionsEl.createEl("button", {
      cls: "rag-chat-action-button rag-chat-delete-button",
      text: "Löschen",
    });
    component.registerDomEvent(deleteButton, "click", () => callbacks.onDelete?.(turn));
  }
}
