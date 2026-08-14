export interface GeminiPart {
  text?: string;

  functionCall?: { id?: string; name: string; args: Record<string, unknown> };
  functionResponse?: { id?: string; name: string; response: Record<string, unknown> };

  inlineData?: { mimeType: string; data: string };
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
