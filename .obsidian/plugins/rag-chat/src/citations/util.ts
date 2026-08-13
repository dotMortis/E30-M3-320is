export function escapeWikilinkPath(notePath: string): string {
  return notePath.replace(/\|/g, "\\|");
}
