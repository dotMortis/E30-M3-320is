import type { App, Component } from "obsidian";
import { buildWebCitationSnippets } from "../citations/web-citations";
import type { ChatTurn } from "../retrieval/types";

export function renderManualCitations(turnEl: HTMLElement, turn: ChatTurn, app: App, component: Component): void {
  if (!turn.citations || turn.citations.length === 0) return;
  const citeEl = turnEl.createDiv({ cls: "rag-chat-citations" });
  citeEl.createSpan({ text: "Quellen (Handbuch): " });
  for (const block of turn.citations) {
    const label = block.seitencode ? `${block.seitencode} (${block.sektion})` : `${block.titel} (${block.sektion})`;
    const link = citeEl.createEl("a", {
      cls: "rag-chat-citation-link",
      text: label,
    });
    component.registerDomEvent(link, "click", (evt: MouseEvent) => {
      evt.preventDefault();
      void app.workspace.openLinkText(block.notePath, "", false);
    });
  }
}

export function renderWebCitations(turnEl: HTMLElement, turn: ChatTurn): void {
  if (!turn.webCitations || turn.webCitations.length === 0) return;
  const snippets = buildWebCitationSnippets(turn.webGroundingChunks ?? [], turn.webGroundingSupports ?? []);
  const webCiteEl = turnEl.createDiv({ cls: "rag-chat-citations rag-chat-web-citations" });
  webCiteEl.createSpan({ text: "Quellen (Web): " });
  for (const web of turn.webCitations) {
    const row = webCiteEl.createSpan({ cls: "rag-chat-web-citation-row" });
    row.createEl("a", {
      cls: "rag-chat-citation-link rag-chat-web-citation-link",
      text: web.title || web.uri,
      attr: { href: web.uri, target: "_blank", rel: "noopener" },
    });
    const snippet = snippets.get(web.uri);
    if (snippet) {
      row.createSpan({ cls: "rag-chat-web-citation-snippet", text: ` – "${snippet}"` });
    }
  }
}
