const FRONTMATTER_END_MARKER = "\n---";

/**
 * Strips YAML frontmatter and lightweight markdown noise (embeds,
 * wikilinks, heading/emphasis markers) so text is closer to plain prose,
 * for both indexing and snippet extraction.
 * @param {string} raw
 * @returns {string}
 */
export function stripForContent(raw) {
  let text = raw;

  if (text.startsWith("---")) {
    const frontmatterEnd = text.indexOf(FRONTMATTER_END_MARKER, 3);
    if (frontmatterEnd !== -1) {
      const afterFrontmatter = text.indexOf("\n", frontmatterEnd + 1);
      text = afterFrontmatter !== -1 ? text.slice(afterFrontmatter + 1) : "";
    }
  }

  return text
    .replace(/!\[\[[^\]]*\]\]/g, " ")
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
    .replace(/[#>*_`|]/g, " ");
}
