import { requestUrlWithRetry } from "../http/retry";
import type { RagChatSettings } from "../settings/types";
import { buildToolsSuffix, SYSTEM_PROMPT } from "./prompts";
import type { FunctionDeclaration, GenerateWithToolsResult, GeminiContent, GroundingChunk, GroundingSupport } from "./types";

/** Human-readable messages for a blocked/truncated generation, keyed by the
 * Gemini API's `promptFeedback.blockReason` or a non-STOP `finishReason`. */
const BLOCK_REASON_MESSAGES: Record<string, string> = {
  SAFETY: "Die Antwort wurde von Sicherheitsfiltern blockiert (SAFETY).",
  RECITATION: "Die Antwort wurde blockiert - möglicherweise wörtliche Wiedergabe urheberrechtlich geschützten Materials (RECITATION).",
  MAX_TOKENS: "Die Antwort wurde wegen Erreichens des Token-Limits abgebrochen, bevor Inhalt erzeugt wurde (MAX_TOKENS).",
  OTHER: "Die Antwort wurde aus einem nicht näher spezifizierten Grund blockiert (OTHER).",
};

export async function generateWithTools(
  contents: GeminiContent[],
  functionDeclarations: FunctionDeclaration[] | null,
  settings: RagChatSettings,
  opts?: { includeGoogleSearch?: boolean; onStatus?: (status: string) => void; signal?: AbortSignal }
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
    { onStatus: opts?.onStatus, label: "Generierung", signal: opts?.signal }
  );

  // `response.json` is a throwing getter (it lazily JSON.parses the raw
  // body) - a non-JSON 200 response must surface a clean error here rather
  // than an uncaught parse exception.
  let json: any;
  try {
    json = response.json;
  } catch (err) {
    throw new Error(
      `Antwort konnte nicht als JSON gelesen werden: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const candidate = json?.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  if (parts.length === 0) {
    const blockReason = json?.promptFeedback?.blockReason as string | undefined;
    const finishReason = candidate?.finishReason as string | undefined;
    const reason = blockReason ?? (finishReason && finishReason !== "STOP" ? finishReason : undefined);
    if (reason) {
      throw new Error(BLOCK_REASON_MESSAGES[reason] ?? `Die Antwort wurde blockiert/abgebrochen (Grund: ${reason}).`);
    }
    throw new Error(`Unexpected generateContent response shape: ${JSON.stringify(json).slice(0, 300)}`);
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

/**
 * Minimal, tool-less sibling to `generateWithTools`: no Google Search, no
 * function declarations, no tool-suffix system instruction - just a plain
 * instruction plus contents. Used only by tts/short-answer.ts to keep the
 * spoken-answer summarization cheap, fast, and unable to trigger the
 * agent/tool machinery.
 */
export async function generatePlainText(
  contents: GeminiContent[],
  settings: RagChatSettings,
  opts?: { signal?: AbortSignal }
): Promise<string> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    throw new Error("Google API key is required - set it in RAG Chat settings.");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.generationModel}:generateContent`;

  const body: Record<string, unknown> = {
    contents,
  };

  const response = await requestUrlWithRetry(
    {
      url,
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { label: "Kurzantwort", signal: opts?.signal }
  );

  let json: any;
  try {
    json = response.json;
  } catch (err) {
    throw new Error(
      `Antwort konnte nicht als JSON gelesen werden: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const candidate = json?.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  if (parts.length === 0) {
    const blockReason = json?.promptFeedback?.blockReason as string | undefined;
    const finishReason = candidate?.finishReason as string | undefined;
    const reason = blockReason ?? (finishReason && finishReason !== "STOP" ? finishReason : undefined);
    if (reason) {
      throw new Error(BLOCK_REASON_MESSAGES[reason] ?? `Die Antwort wurde blockiert/abgebrochen (Grund: ${reason}).`);
    }
    throw new Error(`Unexpected generateContent response shape: ${JSON.stringify(json).slice(0, 300)}`);
  }

  return parts
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
}
