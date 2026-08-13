import { FileSystemAdapter, type Vault } from "obsidian";
import type { RagManifest } from "../retrieval/types";

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

export async function readManifest(vault: Vault, pluginDir: string): Promise<RagManifest> {
  const relPath = `${pluginDir}/rag-manifest.json`;
  const raw = await vault.adapter.read(relPath);
  return JSON.parse(raw) as RagManifest;
}
