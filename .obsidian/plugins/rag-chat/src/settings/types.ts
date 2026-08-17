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

  thinkingEnabled: boolean;

  webSearchEnabled: boolean;

  ttsEnabled: boolean;
  ttsApiKey: string;
  ttsLanguageCode: string;
  ttsVoiceName: string;
  ttsOutputDeviceId: string;
  ttsVolume: number;
  ttsCharCount: number;

  micInputDeviceId: string;

  /** Hardware voice remote (hardware/voice-remote/PLAN.md) - off by default, opt-in per vault copy. */
  remoteEnabled: boolean;
  /** Manual serial port/COM name override; empty string means auto-detect. */
  remoteSerialPortOverride: string;
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
  thinkingEnabled: false,
  webSearchEnabled: false,

  ttsEnabled: false,
  ttsApiKey: "",
  ttsLanguageCode: "de-DE",
  ttsVoiceName: "de-DE-Chirp3-HD-Laomedeia",
  ttsOutputDeviceId: "",
  ttsVolume: 1.0,
  ttsCharCount: 0,

  micInputDeviceId: "",

  remoteEnabled: false,
  remoteSerialPortOverride: "",
};
