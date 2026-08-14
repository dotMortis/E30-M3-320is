import { buildToolsSuffix, SYSTEM_PROMPT } from "./prompts";
import { buildThinkingConfig } from "./thinking-config";
import type { FunctionDeclaration, GeminiContent } from "./types";

export interface GenerateOpts {
  includeGoogleSearch?: boolean;
  thinkingEnabled?: boolean;
  ttsRequested?: boolean;
  /** Skips the domain system prompt and tools suffix entirely, for bare, non-agentic calls (e.g. transcription). */
  skipSystemInstruction?: boolean;
}

export function buildGenerateBody(
  contents: GeminiContent[],
  functionDeclarations: FunctionDeclaration[] | null,
  model: string,
  opts?: GenerateOpts,
): Record<string, unknown> {
  const includeGoogleSearch = opts?.includeGoogleSearch === true;
  const tools: Record<string, unknown>[] = [];
  if (includeGoogleSearch) tools.push({ google_search: {} });
  if (functionDeclarations && functionDeclarations.length > 0) {
    tools.push({ functionDeclarations });
  }

  const body: Record<string, unknown> = { contents };
  if (!opts?.skipSystemInstruction) {
    const systemInstructionText =
      SYSTEM_PROMPT(includeGoogleSearch, opts?.ttsRequested === true) +
      buildToolsSuffix(functionDeclarations, includeGoogleSearch);
    body.systemInstruction = { parts: [{ text: systemInstructionText }] };
  }
  if (tools.length > 0) {
    body.tools = tools;
    if (includeGoogleSearch && functionDeclarations && functionDeclarations.length > 0) {
      body.toolConfig = { includeServerSideToolInvocations: true };
    }
  }
  const thinkingEnabled = opts?.thinkingEnabled === true || includeGoogleSearch;
  const thinkingConfig = buildThinkingConfig(model, thinkingEnabled);
  if (thinkingConfig) body.generationConfig = thinkingConfig;
  return body;
}

export function modelUrl(model: string, method: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}`;
}

export function requireApiKey(apiKey: string): void {
  if (!apiKey) {
    throw new Error("Google API key is required - set it in RAG Chat settings.");
  }
}
