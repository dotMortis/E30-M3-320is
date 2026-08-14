import { buildToolsSuffix, SYSTEM_PROMPT } from "./prompts";
import type { FunctionDeclaration, GeminiContent } from "./types";

export interface GenerateOpts {
  includeGoogleSearch?: boolean;
  thinkingEnabled?: boolean;
}

export function buildGenerateBody(
  contents: GeminiContent[],
  functionDeclarations: FunctionDeclaration[] | null,
  opts?: GenerateOpts,
): Record<string, unknown> {
  const includeGoogleSearch = opts?.includeGoogleSearch === true;
  const tools: Record<string, unknown>[] = [];
  if (includeGoogleSearch) tools.push({ google_search: {} });
  if (functionDeclarations && functionDeclarations.length > 0) {
    tools.push({ functionDeclarations });
  }

  const systemInstructionText =
    SYSTEM_PROMPT(includeGoogleSearch) + buildToolsSuffix(functionDeclarations, includeGoogleSearch);

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: systemInstructionText }] },
    contents,
  };
  if (tools.length > 0) {
    body.tools = tools;
    body.toolConfig = { includeServerSideToolInvocations: true };
  }
  if (opts?.thinkingEnabled !== true) {
    body.generationConfig = { thinkingConfig: { thinkingBudget: 0 } };
  }
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
