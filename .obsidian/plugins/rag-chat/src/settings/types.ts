export interface RagChatSettings {
  geminiApiKey: string;
  embeddingModel: string;
  generationModel: string;
  outputDim: number;
  topK: number;
  similarity: number;
  rrfK: number;
  enableFuzzySearchLeg: boolean;
  maxAgentRounds: number;
}

export const DEFAULT_SETTINGS: RagChatSettings = {
  geminiApiKey: "",
  embeddingModel: "gemini-embedding-2",
  generationModel: "gemini-3.6-flash",
  outputDim: 3072,
  topK: 8,
  similarity: 0.55,
  rrfK: 2,
  enableFuzzySearchLeg: true,
  maxAgentRounds: 5,
};
