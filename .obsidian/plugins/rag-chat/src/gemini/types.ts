export interface GeminiPart {
  text?: string;
  // `id` correlates a functionCall with its functionResponse - required when
  // multiple calls (or google_search + custom tools) appear in the same
  // turn, since the model may not otherwise be able to tell which response
  // belongs to which call. Optional because not every response includes it
  // (e.g. simple single-tool turns).
  functionCall?: { id?: string; name: string; args: Record<string, unknown> };
  functionResponse?: { id?: string; name: string; response: Record<string, unknown> };
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface GroundingChunk {
  uri: string;
  title: string;
}

export interface GroundingSupport {
  startIndex: number;
  endIndex: number;
  chunkIndices: number[];
  text?: string;
}

export interface GenerateWithToolsResult {
  parts: GeminiPart[];
  groundingChunks: GroundingChunk[];
  groundingSupports: GroundingSupport[];
  finishReason?: string;
}
