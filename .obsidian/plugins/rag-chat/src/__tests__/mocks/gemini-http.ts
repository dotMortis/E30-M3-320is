import { requestUrl } from "./obsidian";

export interface FakeRequestUrlResponse {
  status: number;
  headers: Record<string, string>;
  arrayBuffer: ArrayBuffer;
  json: unknown;
  text: string;
}

export function fakeResponse(status: number, json?: unknown, text?: string): FakeRequestUrlResponse {
  const resolvedText = text ?? (json !== undefined ? JSON.stringify(json) : "");
  return {
    status,
    headers: {},
    arrayBuffer: new ArrayBuffer(0),
    get json(): unknown {
      if (json !== undefined) return json;
      return JSON.parse(resolvedText);
    },
    text: resolvedText,
  };
}

export function embedContentResponse(values: number[]): FakeRequestUrlResponse {
  return fakeResponse(200, { embedding: { values } });
}

export interface FunctionCallSpec {
  id?: string;
  name: string;
  args: Record<string, unknown>;
}

export interface GroundingChunkSpec {
  uri: string;
  title?: string;
}

export interface GroundingSupportSpec {
  startIndex?: number;
  endIndex: number;
  chunkIndices: number[];
  text?: string;
}

export function generateContentResponse(opts: {
  text?: string;
  functionCalls?: FunctionCallSpec[];
  groundingChunks?: GroundingChunkSpec[];
  groundingSupports?: GroundingSupportSpec[];
  finishReason?: string;
}): FakeRequestUrlResponse {
  const parts: Record<string, unknown>[] = [];
  if (opts.text !== undefined) parts.push({ text: opts.text });
  for (const fc of opts.functionCalls ?? []) {
    parts.push({ functionCall: { ...(fc.id ? { id: fc.id } : {}), name: fc.name, args: fc.args } });
  }

  const candidate: Record<string, unknown> = {
    content: { parts },
    finishReason: opts.finishReason,
  };

  if (opts.groundingChunks || opts.groundingSupports) {
    candidate.groundingMetadata = {
      groundingChunks: (opts.groundingChunks ?? []).map((c) => ({ web: { uri: c.uri, title: c.title } })),
      groundingSupports: (opts.groundingSupports ?? []).map((s) => ({
        segment: { startIndex: s.startIndex, endIndex: s.endIndex, text: s.text },
        groundingChunkIndices: s.chunkIndices,
      })),
    };
  }

  return fakeResponse(200, { candidates: [candidate] });
}

export function errorResponse(status: number, message: string): FakeRequestUrlResponse {
  return fakeResponse(status, { error: { message } });
}

export function mockRequestUrlSequence(responses: FakeRequestUrlResponse[]): void {
  for (const response of responses) {
    requestUrl.mockResolvedValueOnce(response);
  }
}

export function mockRequestUrlAlways(response: FakeRequestUrlResponse): void {
  requestUrl.mockResolvedValue(response);
}

export { requestUrl };
