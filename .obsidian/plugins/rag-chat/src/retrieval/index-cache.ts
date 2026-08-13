import { readFileSync } from "node:fs";
import { loadTextIndex, loadVectorShard } from "./orama-schema";
import type { CachedIndices, RagManifest, ReferenceChunkMap } from "./types";

let cached: CachedIndices | null = null;
let cachedPluginDir: string | null = null;

export async function getIndices(pluginDir: string, manifest: RagManifest): Promise<CachedIndices> {
  if (cached && cachedPluginDir === pluginDir) return cached;
  const textDb = await loadTextIndex(`${pluginDir}/${manifest.textIndexFile}`);
  const vectorDbs = await Promise.all(
    Array.from({ length: manifest.vectorShardCount }, (_, i) =>
      loadVectorShard(`${pluginDir}/${manifest.vectorIndexFilePattern.replace("{i}", String(i))}`)
    )
  );
  const referenceChunksRaw = JSON.parse(
    readFileSync(`${pluginDir}/${manifest.referenceChunksFile}`, "utf-8")
  ) as Record<string, { text: string; titel: string; notePath: string }>;
  const referenceChunks: ReferenceChunkMap = new Map(Object.entries(referenceChunksRaw));
  cached = { textDb, vectorDbs, referenceChunks };
  cachedPluginDir = pluginDir;
  return cached;
}
