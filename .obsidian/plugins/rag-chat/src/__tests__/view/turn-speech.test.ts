import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSettings } from "../fixtures/settings";
import { resetObsidianMocks } from "../mocks/obsidian";
import type { ChatTurn } from "../../retrieval/types";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

const synthesizeSpeech = vi.fn();
vi.mock("../../tts/client", () => ({ synthesizeSpeech }));

const buildShortAnswer = vi.fn();
vi.mock("../../tts/short-answer", () => ({ buildShortAnswer }));

const recordCharsUsed = vi.fn().mockResolvedValue(undefined);
vi.mock("../../tts/usage", () => ({ recordCharsUsed }));

const ttsPlaybackMock = {
  play: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
  setOnEnded: vi.fn(),
};
vi.mock("../../tts/playback", () => ttsPlaybackMock);

let TurnSpeech: typeof import("../../view/turn-speech").TurnSpeech;

beforeEach(async () => {
  resetObsidianMocks();
  vi.clearAllMocks();
  recordCharsUsed.mockResolvedValue(undefined);
  ttsPlaybackMock.play.mockResolvedValue(undefined);
  const mod = await import("../../view/turn-speech");
  TurnSpeech = mod.TurnSpeech;
});

function makeHost(settings = fakeSettings({ ttsEnabled: true })) {
  return {
    plugin: () => ({ settings }) as any,
    isClosed: () => false,
    syncTurn: vi.fn(),
    onCharCounterChanged: vi.fn(),
  };
}

function makeTurn(overrides: Partial<ChatTurn> = {}): ChatTurn {
  return { role: "assistant", text: "Volle Antwort.", ...overrides };
}

describe("TurnSpeech", () => {
  it("reuses the speculatively synthesized audio started by beginStreamingSpeech instead of re-synthesizing", async () => {
    synthesizeSpeech.mockResolvedValue("base64audio");
    const host = makeHost();
    const speech = new TurnSpeech(host);
    const turn = makeTurn({ ttsShortAnswer: "Kurze Antwort." });

    speech.beginStreamingSpeech(turn, "Kurze Antwort.");
    await speech.synthesizeAndPlay(turn);

    expect(synthesizeSpeech).toHaveBeenCalledTimes(1);
    expect(synthesizeSpeech).toHaveBeenCalledWith("Kurze Antwort.", host.plugin().settings, expect.anything());
    expect(buildShortAnswer).not.toHaveBeenCalled();
    expect(ttsPlaybackMock.play).toHaveBeenCalledWith("base64audio", expect.anything());
  });

  it("does not start speculative synthesis when TTS is disabled", () => {
    const host = makeHost(fakeSettings({ ttsEnabled: false }));
    const speech = new TurnSpeech(host);
    speech.beginStreamingSpeech(makeTurn(), "Kurze Antwort.");
    expect(synthesizeSpeech).not.toHaveBeenCalled();
  });

  it("falls back to a fresh synth call when the speculative synthesis failed", async () => {
    synthesizeSpeech.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce("retry-audio");
    const host = makeHost();
    const speech = new TurnSpeech(host);
    const turn = makeTurn({ ttsShortAnswer: "Kurze Antwort." });

    speech.beginStreamingSpeech(turn, "Kurze Antwort.");
    await speech.synthesizeAndPlay(turn);

    expect(synthesizeSpeech).toHaveBeenCalledTimes(2);
    expect(ttsPlaybackMock.play).toHaveBeenCalledWith("retry-audio", expect.anything());
  });

  it("falls back to buildShortAnswer when the turn has no streamed short answer", async () => {
    buildShortAnswer.mockResolvedValue("Zusammengefasst.");
    synthesizeSpeech.mockResolvedValue("base64audio");
    const host = makeHost();
    const speech = new TurnSpeech(host);
    const turn = makeTurn();

    await speech.synthesizeAndPlay(turn);

    expect(buildShortAnswer).toHaveBeenCalledWith(turn.text, host.plugin().settings, expect.anything());
    expect(synthesizeSpeech).toHaveBeenCalledWith("Zusammengefasst.", host.plugin().settings, expect.anything());
  });

  it("records char usage based on the short text actually spoken", async () => {
    synthesizeSpeech.mockResolvedValue("base64audio");
    const host = makeHost();
    const speech = new TurnSpeech(host);
    const turn = makeTurn({ ttsShortAnswer: "Kurz." });

    await speech.synthesizeAndPlay(turn);

    expect(recordCharsUsed).toHaveBeenCalledWith(host.plugin(), "Kurz.".length);
  });
});
