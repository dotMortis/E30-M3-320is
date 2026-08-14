export function escapeWikilinkPath(notePath: string): string {
  return notePath.replace(/\|/g, "\\|");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderCitationMatch<T extends { notePath: string }>(
  code: string,
  matches: T[] | undefined,
  labelFor: (match: T) => string
): string {
  if (!matches || matches.length === 0) {
    return `<span class="rag-chat-citation-unverified" title="Konnte nicht gegen die abgerufenen Quellen dieser Antwort verifiziert werden">${escapeHtml(code)}</span>`;
  }
  if (matches.length === 1) {
    return `[[${escapeWikilinkPath(matches[0].notePath)}|${code}]]`;
  }
  const items = matches.map((m) => `[[${escapeWikilinkPath(m.notePath)}|${labelFor(m)}]]`).join(" · ");
  return `<details class="rag-chat-citation-ambiguous"><summary>${escapeHtml(code)}</summary>${items}</details>`;
}
