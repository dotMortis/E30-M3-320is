import { readFileSync } from "node:fs";
import { loadTextIndex, loadVectorShard } from "./orama-schema";
import type { CachedIndices, RagManifest, ReferenceChunkMap } from "./types";

interface CacheKey {
  pluginDir: string;
  corpusHash: string;
}

let cachedKey: CacheKey | null = null;
// Caching the in-flight Promise (not just the eventually-resolved value)
// means concurrent callers before the first load finishes all share the
// same load instead of each triggering their own redundant disk read.
let cachedPromise: Promise<CachedIndices> | null = null;

async function loadIndices(pluginDir: string, manifest: RagManifest): Promise<CachedIndices> {
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
  return { textDb, vectorDbs, referenceChunks };
}

export async function getIndices(pluginDir: string, manifest: RagManifest): Promise<CachedIndices> {
  const key: CacheKey = { pluginDir, corpusHash: manifest.corpusHash };
  const sameKey = cachedKey !== null && cachedKey.pluginDir === key.pluginDir && cachedKey.corpusHash === key.corpusHash;
  if (cachedPromise && sameKey) return cachedPromise;

  cachedKey = key;
  const promise = loadIndices(pluginDir, manifest).catch((err) => {
    // Don't cache a failed load - allow the next call to retry from scratch.
    if (cachedPromise === promise) {
      cachedKey = null;
      cachedPromise = null;
    }
    throw err;
  });
  cachedPromise = promise;
  return promise;
}

/**
 * Clears the cached indices, forcing the next `getIndices` call to reload
 * from disk regardless of `corpusHash`. Backs the "Reload RAG index"
 * command, for when the underlying index files changed but the manifest's
 * corpusHash wasn't bumped (or a corrupt/partial load needs retrying).
 */
export function clearIndicesCache(): void {
  cachedKey = null;
  cachedPromise = null;
}
