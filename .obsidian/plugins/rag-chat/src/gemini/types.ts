export interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
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
