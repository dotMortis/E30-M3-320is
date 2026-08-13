import type { ChatTurn } from "../retrieval/types";

export function showsStatus(turn: ChatTurn): boolean {
  return turn.role === "assistant" && turn.text.length === 0 && Boolean(turn.status);
}

export interface StatusLogElements {
  listEl: HTMLElement;
  summaryEl: HTMLElement;
}

export function renderStatusLog(turnEl: HTMLElement, turn: ChatTurn): StatusLogElements {
  const log = turn.statusLog!;
  const details = turnEl.createEl("details", { cls: "rag-chat-status-log" });
  const summaryEl = details.createEl("summary", { text: `Rechercheverlauf (${log.length} Schritte)` });
  const listEl = details.createEl("ul", { cls: "rag-chat-status-log-list" });
  for (const line of log) {
    listEl.createEl("li", { cls: "rag-chat-status-log-item", text: line });
  }
  return { listEl, summaryEl };
}

export function appendStatusLogLine(elements: StatusLogElements, turn: ChatTurn): void {
  const log = turn.statusLog;
  if (!log || log.length === 0) return;
  elements.listEl.createEl("li", { cls: "rag-chat-status-log-item", text: log[log.length - 1] });
  elements.summaryEl.setText(`Rechercheverlauf (${log.length} Schritte)`);
}
