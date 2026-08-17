import { beforeEach, vi } from "vitest";
import type { FakeElement } from "../mocks/dom";
import { createFakeApp } from "../mocks/fake-app";
import { fakeManifest } from "../fixtures/manifest";
import { fakeSettings } from "../fixtures/settings";
import { listModelsResponse, mockRequestUrlAlways } from "../mocks/gemini-http";
import { resetObsidianMocks } from "../mocks/obsidian";

export function fake(el: HTMLElement): FakeElement {
  return el as unknown as FakeElement;
}

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

export const getIndices = vi.fn();
vi.mock("../../retrieval/index-cache", () => ({ getIndices }));

export const answerQuestion = vi.fn();
export const answerQuestionFromAudio = vi.fn();
export const continueAnswer = vi.fn();
vi.mock("../../workflow", () => ({ answerQuestion, answerQuestionFromAudio, continueAnswer }));

export const confirmModal = vi.fn();
vi.mock("../../view/confirm-modal", () => ({ confirmModal }));

export const buildShortAnswer = vi.fn();
vi.mock("../../tts/short-answer", () => ({ buildShortAnswer }));

export const synthesizeSpeech = vi.fn();
vi.mock("../../tts/client", () => ({ synthesizeSpeech }));

export const recordCharsUsed = vi.fn().mockResolvedValue(undefined);
vi.mock("../../tts/usage", () => ({ recordCharsUsed }));

export const listOutputDevices = vi.fn().mockResolvedValue([]);
vi.mock("../../tts/devices", () => ({ listOutputDevices }));

export const micRecorderStart = vi.fn().mockResolvedValue(undefined);
export const micRecorderStop = vi.fn().mockResolvedValue(new Blob(["fake-audio"], { type: "audio/webm" }));
vi.mock("../../stt/recorder", () => ({
  MicRecorder: vi.fn().mockImplementation(function MicRecorder(this: { start: unknown; stop: unknown }) {
    this.start = micRecorderStart;
    this.stop = micRecorderStop;
  }),
}));

export const blobToWavBase64 = vi.fn().mockResolvedValue({ base64: "QUJD", mimeType: "audio/wav" });
vi.mock("../../stt/wav-encode", () => ({ blobToWavBase64 }));

export const ttsPlaybackMock = {
  play: vi.fn().mockResolvedValue(undefined),
  setVolume: vi.fn(),
  stop: vi.fn(),
  isPlaying: vi.fn().mockReturnValue(false),
  setOnEnded: vi.fn(),
  dispose: vi.fn(),
};
vi.mock("../../tts/playback", () => ttsPlaybackMock);

export let RagChatView: typeof import("../../view/view").RagChatView;
export let RAG_CHAT_VIEW_TYPE: typeof import("../../view/view").RAG_CHAT_VIEW_TYPE;

beforeEach(async () => {
  resetObsidianMocks();
  vi.clearAllMocks();
  mockRequestUrlAlways(listModelsResponse([]));
  const mod = await import("../../view/view");
  RagChatView = mod.RagChatView;
  RAG_CHAT_VIEW_TYPE = mod.RAG_CHAT_VIEW_TYPE;
});

export const DONE_RESULT = {
  status: "done" as const,
  text: "Zylinderkopfschrauben: 30 Nm. [Seite 11-09]",
  manualCitations: [],
  webCitations: [],
  webGroundingChunks: [],
  webGroundingSupports: [],
};

export function makeView() {
  const app = createFakeApp();
  const plugin = {
    settings: fakeSettings(),
    getManifest: vi.fn().mockResolvedValue(fakeManifest()),
    getPluginDirFullPath: vi.fn().mockReturnValue("/plugin/dir"),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    getRemoteStatus: vi.fn().mockReturnValue(null),
  };
  const leaf = { app };
  const view = new RagChatView(leaf as any, plugin as any);
  return { view, app, plugin };
}
