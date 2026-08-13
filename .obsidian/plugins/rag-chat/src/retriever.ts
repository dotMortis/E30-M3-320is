import { requestUrl, type Vault } from "obsidian";
import { search, type AnyOrama } from "@orama/orama";
import { loadIndex, type RagDocument } from "./orama-schema";
import type { RagChatSettings } from "./settings";

/** Query-time task prefix for gemini-embedding-2 (see PLAN.md - this model has
 * no task_type EmbedContentConfig param; steering is a text prefix instead). */
const QUERY_PREFIX_TMPL = "task: search result | query: {content}";

export interface RagManifest {
  embeddingModel: string;
  embeddingDims: number;
  cacheDims: number;
  docPrefixTemplate: string;
  queryPrefixTemplate: string;
  generationModel: string;
  genProviderDefault: string;
  noteCount: number;
  textChunkCount: number;
  multimodalCount: number;
  totalRowCount: number;
  corpusHash: string;
  chunkedAt: string;
  builtAt: string;
}

export interface RetrievedHit {
  score: number;
  notePath: string;
  seitencode: string;
  sektion: string;
  titel: string;
  kind: "text" | "multimodal";
}

export interface ContextBlock {
  notePath: string;
  seitencode: string;
  sektion: string;
  titel: string;
  fullText: string;
}

/** Validates the shipped manifest against the plugin's settings (embedding-parity
 * guard - see PLAN.md). Returns a list of human-readable warning strings (empty = OK). */
export function validateManifest(manifest: RagManifest, settings: RagChatSettings): string[] {
  const warnings: string[] = [];
  if (manifest.embeddingModel !== settings.embeddingModel) {
    warnings.push(
      `Index was built with embedding model "${manifest.embeddingModel}", but settings specify "${settings.embeddingModel}". Update settings or rebuild the index.`
    );
  }
  if (manifest.embeddingDims !== settings.outputDim) {
    warnings.push(
      `Index was built at ${manifest.embeddingDims} dims (the shipped/query dims), but settings specify ${settings.outputDim}. These MUST match or vector search will silently return garbage. Fix settings.outputDim.`
    );
  }
  return warnings;
}

/** Embeds a user query via the Google gemini-embedding-2 REST API (non-streaming,
 * via Obsidian's CORS-safe requestUrl - no streaming needed here). */
export async function embedQuery(query: string, settings: RagChatSettings): Promise<number[]> {
  if (!settings.geminiApiKey) {
    throw new Error("Google API key (GEMINI_API_KEY) is required for query embeddings - set it in RAG Chat settings.");
  }
  const prefixed = QUERY_PREFIX_TMPL.replace("{content}", query);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.embeddingModel}:embedContent`;
  const response = await requestUrl({
    url,
    method: "POST",
    headers: {
      "x-goog-api-key": settings.geminiApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: { parts: [{ text: prefixed }] },
      outputDimensionality: settings.outputDim,
    }),
  });
  const values = response.json?.embedding?.values;
  if (!Array.isArray(values)) {
    throw new Error(`Unexpected embedContent response shape: ${JSON.stringify(response.json).slice(0, 300)}`);
  }
  return values as number[];
}

let cachedDb: AnyOrama | null = null;
let cachedDbPath: string | null = null;

/** Loads (and caches) the Orama index from the plugin directory. */
export async function getIndex(indexPath: string): Promise<AnyOrama> {
  if (cachedDb && cachedDbPath === indexPath) return cachedDb;
  cachedDb = await loadIndex(indexPath);
  cachedDbPath = indexPath;
  return cachedDb;
}

/** Runs hybrid (BM25 + vector) search and returns typed hits. */
export async function hybridSearch(
  db: AnyOrama,
  term: string,
  vector: number[],
  settings: RagChatSettings
): Promise<RetrievedHit[]> {
  const result = await search(db, {
    mode: "hybrid",
    term,
    vector: { value: vector, property: "embedding" },
    similarity: settings.similarity,
    limit: settings.topK,
  });
  return result.hits.map((h) => {
    const doc = h.document as unknown as RagDocument;
    return {
      score: h.score,
      notePath: doc.notePath,
      seitencode: doc.seitencode,
      sektion: doc.sektion,
      titel: doc.titel,
      kind: doc.kind,
    };
  });
}

/**
 * Parent-note expansion (see PLAN.md Phase 4): dedupe hits by notePath (the
 * UNIQUE key - seitencode alone has 47 known collisions across the vault,
 * see PLAN.md), read each source note IN FULL via vault.read (the "Parent
 * Note" pattern - never truncate), and return context blocks labelled with
 * notePath + seitencode + sektion (that pair disambiguates the collisions).
 */
export async function expandToParentNotes(hits: RetrievedHit[], vault: Vault): Promise<ContextBlock[]> {
  const seen = new Set<string>();
  const blocks: ContextBlock[] = [];
  for (const hit of hits) {
    if (seen.has(hit.notePath)) continue;
    seen.add(hit.notePath);
    const file = vault.getFileByPath(hit.notePath);
    if (!file) continue; // note may have moved/been deleted since the index was built
    const fullText = await vault.read(file);
    blocks.push({
      notePath: hit.notePath,
      seitencode: hit.seitencode,
      sektion: hit.sektion,
      titel: hit.titel,
      fullText,
    });
  }
  return blocks;
}

/** Assembles the <context> block fed to the generation model. */
export function buildContextXml(blocks: ContextBlock[]): string {
  const parts = blocks.map(
    (b) =>
      `<document source="${b.notePath}" seitencode="${b.seitencode}" sektion="${b.sektion}">\n${b.fullText}\n</document>`
  );
  return `<context>\n${parts.join("\n\n")}\n</context>`;
}
