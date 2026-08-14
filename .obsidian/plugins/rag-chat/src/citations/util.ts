// Only escapes `|` (the wikilink display-text separator) - a notePath
// containing a literal `]]` could still prematurely close the `[[...]]`
// wikilink early. Not currently known to occur in this vault's note paths;
// documented as a known gap rather than fixed, since Obsidian file paths
// can't practically contain `]]` from normal usage.
export function escapeWikilinkPath(notePath: string): string {
  return notePath.replace(/\|/g, "\\|");
}

/**
 * Escapes text before it's interpolated into raw HTML (e.g. a `title="..."`
 * attribute or `<summary>...</summary>` body). The citation fallback text
 * this guards is model-generated, derived from retrieved manual/web content,
 * and must not be able to inject markup.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Shared rendering for a single citation "code" (a seitencode for page
 * citations, a titel for reference citations) against the set of retrieved
 * blocks matching it:
 * - no match: an HTML-escaped "unverified" span (hallucinated/typo'd code).
 * - exactly one match: a plain wikilink.
 * - multiple matches (a collision): an expandable `<details>` listing every
 *   real candidate as its own wikilink, disambiguated via `labelFor`.
 *
 * Used by both citations/page-citations.ts and citations/reference-citations.ts
 * so the two can't drift apart on this shared behavior.
 */
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
