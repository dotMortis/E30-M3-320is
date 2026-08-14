import { postSseWithRetry } from "../http/stream";
import type { RagChatSettings } from "../settings/types";
import { blockReasonMessage } from "./block-reason";
import { buildGenerateBody, modelUrl, requireApiKey, type GenerateOpts } from "./request-body";
import { mapGroundingChunks, mapGroundingSupports } from "./response";
import type { FunctionDeclaration, GenerateWithToolsResult, GeminiContent, GeminiPart, GroundingChunk, GroundingSupport } from "./types";

export async function generateWithToolsStreaming(
  contents: GeminiContent[],
  functionDeclarations: FunctionDeclaration[] | null,
  settings: RagChatSettings,
  opts: GenerateOpts & {
    onDelta: (textChunk: string) => void;
    onStatus?: (status: string) => void;
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
  },
): Promise<GenerateWithToolsResult> {
  requireApiKey(settings.geminiApiKey);
  const url = modelUrl(settings.generationModel, "streamGenerateContent?alt=sse");
  const body = buildGenerateBody(contents, functionDeclarations, opts);

  const parts: GeminiPart[] = [];
  let groundingChunks: GroundingChunk[] = [];
  let groundingSupports: GroundingSupport[] = [];
  let finishReason: string | undefined;
  let lastJson: any;
  let lastCandidate: any;

  await postSseWithRetry(
    {
      url,
      headers: { "x-goog-api-key": settings.geminiApiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    {
      label: "Generierung",
      signal: opts.signal,
      onStatus: opts.onStatus,
      fetchImpl: opts.fetchImpl,
      onEvent: (event) => {
        const json = event as any;
        const candidate = json?.candidates?.[0];
        if (!candidate) return;
        lastJson = json;
        lastCandidate = candidate;

        const chunkParts: GeminiPart[] = candidate?.content?.parts ?? [];
        for (const part of chunkParts) {
          parts.push(part);
          if (typeof part.text === "string" && part.text.length > 0) {
            opts.onDelta(part.text);
          }
        }

        const rawChunks = candidate?.groundingMetadata?.groundingChunks;
        if (rawChunks) groundingChunks = mapGroundingChunks(rawChunks);
        const rawSupports = candidate?.groundingMetadata?.groundingSupports;
        if (rawSupports) groundingSupports = mapGroundingSupports(rawSupports);
        if (candidate?.finishReason) finishReason = candidate.finishReason;
      },
    },
  );

  if (parts.length === 0) {
    const msg = blockReasonMessage(lastJson, lastCandidate);
    if (msg) throw new Error(msg);
    throw new Error("Unexpected streamGenerateContent response: no parts received.");
  }

  return { parts, groundingChunks, groundingSupports, finishReason };
}
