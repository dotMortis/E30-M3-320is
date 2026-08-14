import { readFileSync } from "node:fs";
import { loadTextIndex, loadVectorShard } from "./orama-schema";
import type { CachedIndices, RagManifest, ReferenceChunkMap } from "./types";

interface CacheKey {
  pluginDir: string;
  corpusHash: string;
}

let cachedKey: CacheKey | null = null;

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

    if (cachedPromise === promise) {
      cachedKey = null;
      cachedPromise = null;
    }
    throw err;
  });
  cachedPromise = promise;
  return promise;
}

export function clearIndicesCache(): void {
  cachedKey = null;
  cachedPromise = null;
}
