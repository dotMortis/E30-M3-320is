import { requestUrlWithRetry } from "../http/retry";
import type { RagChatSettings } from "../settings/types";
import type { RagManifest } from "./types";

const QUERY_PREFIX_TMPL = "task: search result | query: {content}";

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

export async function embedQuery(
  query: string,
  settings: RagChatSettings,
  onStatus?: (status: string) => void
): Promise<number[]> {
  if (!settings.geminiApiKey) {
    throw new Error("Google API key (GEMINI_API_KEY) is required for query embeddings - set it in RAG Chat settings.");
  }
  const prefixed = QUERY_PREFIX_TMPL.replace("{content}", query);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.embeddingModel}:embedContent`;
  const response = await requestUrlWithRetry(
    {
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
    },
    { onStatus, label: "Embedding" }
  );
  const values = response.json?.embedding?.values;
  if (!Array.isArray(values)) {
    throw new Error(`Unexpected embedContent response shape: ${JSON.stringify(response.json).slice(0, 300)}`);
  }
  return values as number[];
}
