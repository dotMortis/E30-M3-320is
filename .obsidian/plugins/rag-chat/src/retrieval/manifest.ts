import type { Vault } from "obsidian";
import type { RagManifest } from "./types";

export async function readManifest(vault: Vault, pluginDir: string): Promise<RagManifest> {
  const relPath = `${pluginDir}/rag-manifest.json`;
  const raw = await vault.adapter.read(relPath);
  return JSON.parse(raw) as RagManifest;
}
