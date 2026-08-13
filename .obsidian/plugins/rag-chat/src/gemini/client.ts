import { requestUrlWithRetry } from "../http/retry";
import type { RagChatSettings } from "../settings/types";
import { buildToolsSuffix, SYSTEM_PROMPT } from "./prompts";
import type { FunctionDeclaration, GenerateWithToolsResult, GeminiContent, GroundingChunk, GroundingSupport } from "./types";

export async function generateWithTools(
  contents: GeminiContent[],
  functionDeclarations: FunctionDeclaration[] | null,
  settings: RagChatSettings,
  opts?: { includeGoogleSearch?: boolean; onStatus?: (status: string) => void }
): Promise<GenerateWithToolsResult> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    throw new Error("Google API key is required - set it in RAG Chat settings.");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.generationModel}:generateContent`;

  const includeGoogleSearch = opts?.includeGoogleSearch !== false;
  const tools: Record<string, unknown>[] = [];
  if (includeGoogleSearch) {
    tools.push({ google_search: {} });
  }
  if (functionDeclarations && functionDeclarations.length > 0) {
    tools.push({ functionDeclarations });
  }

  const systemInstructionText = SYSTEM_PROMPT + buildToolsSuffix(functionDeclarations, includeGoogleSearch);

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: systemInstructionText }] },
    contents,
  };
  if (tools.length > 0) {
    body.tools = tools;
    body.toolConfig = { includeServerSideToolInvocations: true };
  }

  const response = await requestUrlWithRetry(
    {
      url,
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { onStatus: opts?.onStatus, label: "Generierung" }
  );

  const candidate = response.json?.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  if (parts.length === 0) {
    throw new Error(`Unexpected generateContent response shape: ${JSON.stringify(response.json).slice(0, 300)}`);
  }

  const rawChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  const groundingChunks: GroundingChunk[] = rawChunks.map((c: Record<string, any>) => ({
    uri: c.web?.uri ?? "",
    title: c.web?.title ?? c.web?.uri ?? "",
  }));

  const rawSupports = candidate?.groundingMetadata?.groundingSupports ?? [];
  const groundingSupports: GroundingSupport[] = rawSupports
    .filter(
      (s: Record<string, any>) =>
        typeof s.segment?.endIndex === "number" && Array.isArray(s.groundingChunkIndices) && s.groundingChunkIndices.length > 0
    )
    .map((s: Record<string, any>) => ({
      startIndex: typeof s.segment?.startIndex === "number" ? s.segment.startIndex : 0,
      endIndex: s.segment.endIndex,
      chunkIndices: s.groundingChunkIndices,
      text: typeof s.segment?.text === "string" ? s.segment.text : undefined,
    }));

  return { parts, groundingChunks, groundingSupports, finishReason: candidate?.finishReason };
}
