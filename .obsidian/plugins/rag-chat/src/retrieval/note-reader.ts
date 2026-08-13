import type { Vault } from "obsidian";

export async function readNoteOrNull(vault: Vault, notePath: string): Promise<string | null> {
  const file = vault.getFileByPath(notePath);
  if (!file) return null;
  return await vault.read(file);
}
