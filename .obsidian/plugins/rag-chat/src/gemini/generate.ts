import { readResponseJson } from "../http/read-json";
import { requestUrlWithRetry } from "../http/retry";
import type { RagChatSettings } from "../settings/types";
import { blockReasonMessage } from "./block-reason";
import { buildGenerateBody, modelUrl, requireApiKey, type GenerateOpts } from "./request-body";
import { mapGroundingChunks, mapGroundingSupports } from "./response";
import { buildThinkingConfig } from "./thinking-config";
import type { FunctionDeclaration, GenerateWithToolsResult, GeminiContent } from "./types";

export async function generateWithTools(
  contents: GeminiContent[],
  functionDeclarations: FunctionDeclaration[] | null,
  settings: RagChatSettings,
  opts?: GenerateOpts & {
    onStatus?: (status: string) => void;
    signal?: AbortSignal;
  },
): Promise<GenerateWithToolsResult> {
  requireApiKey(settings.geminiApiKey);
  const url = modelUrl(settings.generationModel, "generateContent");
  const body = buildGenerateBody(contents, functionDeclarations, settings.generationModel, opts);

  const response = await requestUrlWithRetry(
    {
      url,
      method: "POST",
      headers: { "x-goog-api-key": settings.geminiApiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { onStatus: opts?.onStatus, label: "Generierung", signal: opts?.signal },
  );

  const json = readResponseJson(response);
  const candidate = json?.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  if (parts.length === 0) {
    const msg = blockReasonMessage(json, candidate);
    if (msg) throw new Error(msg);
    throw new Error(`Unexpected generateContent response shape: ${JSON.stringify(json).slice(0, 300)}`);
  }

  return {
    parts,
    groundingChunks: mapGroundingChunks(candidate?.groundingMetadata?.groundingChunks ?? []),
    groundingSupports: mapGroundingSupports(candidate?.groundingMetadata?.groundingSupports ?? []),
    finishReason: candidate?.finishReason,
  };
}

export async function generatePlainText(
  contents: GeminiContent[],
  settings: RagChatSettings,
  opts?: { signal?: AbortSignal },
): Promise<string> {
  requireApiKey(settings.geminiApiKey);
  const url = modelUrl(settings.generationModel, "generateContent");
  const body: Record<string, unknown> = {
    contents,
    generationConfig: buildThinkingConfig(settings.generationModel, false),
  };

  const response = await requestUrlWithRetry(
    {
      url,
      method: "POST",
      headers: { "x-goog-api-key": settings.geminiApiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { label: "Kurzantwort", signal: opts?.signal },
  );

  const json = readResponseJson(response);
  const candidate = json?.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  if (parts.length === 0) {
    const msg = blockReasonMessage(json, candidate);
    if (msg) throw new Error(msg);
    throw new Error(`Unexpected generateContent response shape: ${JSON.stringify(json).slice(0, 300)}`);
  }

  return parts
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
}
