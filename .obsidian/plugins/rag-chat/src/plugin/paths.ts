import { FileSystemAdapter, type Vault } from "obsidian";

export function getPluginDir(manifest: { dir?: string; id: string }): string {
  return manifest.dir ?? `.obsidian/plugins/${manifest.id}`;
}

export function getPluginDirFullPath(vault: Vault, manifest: { dir?: string; id: string }): string {
  const relPath = getPluginDir(manifest);
  if (vault.adapter instanceof FileSystemAdapter) {
    return vault.adapter.getFullPath(relPath);
  }
  return relPath;
}
