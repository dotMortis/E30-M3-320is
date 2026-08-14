import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorResponse, fakeResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import { resetObsidianMocks } from "../mocks/obsidian";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let listChirp3Voices: typeof import("../../tts/voices").listChirp3Voices;

beforeEach(async () => {
  resetObsidianMocks();
  ({ listChirp3Voices } = await import("../../tts/voices"));
});

describe("listChirp3Voices", () => {
  it("returns an empty list without a network call when no API key is set", async () => {
    const voices = await listChirp3Voices("");
    expect(voices).toEqual([]);
    expect(requestUrl).not.toHaveBeenCalled();
  });

  it("filters to voices whose name contains 'Chirp3-HD'", async () => {
    mockRequestUrlSequence([
      fakeResponse(200, {
        voices: [
          { name: "de-DE-Chirp3-HD-Laomedeia", languageCodes: ["de-DE"] },
          { name: "de-DE-Standard-A", languageCodes: ["de-DE"] },
          { name: "en-US-Chirp3-HD-Charon", languageCodes: ["en-US"] },
        ],
      }),
    ]);
    const voices = await listChirp3Voices("AIza-test");
    expect(voices.map((v) => v.name)).toEqual(["de-DE-Chirp3-HD-Laomedeia", "en-US-Chirp3-HD-Charon"]);
  });

  it("preserves each voice's languageCodes", async () => {
    mockRequestUrlSequence([
      fakeResponse(200, { voices: [{ name: "de-DE-Chirp3-HD-Laomedeia", languageCodes: ["de-DE"] }] }),
    ]);
    const voices = await listChirp3Voices("AIza-test");
    expect(voices).toEqual([{ name: "de-DE-Chirp3-HD-Laomedeia", languageCodes: ["de-DE"] }]);
  });

  it("sends the API key via the X-Goog-Api-Key header", async () => {
    mockRequestUrlSequence([fakeResponse(200, { voices: [] })]);
    await listChirp3Voices("AIza-test");
    const call = requestUrl.mock.calls[0][0] as { headers: Record<string, string> };
    expect(call.headers["X-Goog-Api-Key"]).toBe("AIza-test");
  });

  it("returns an empty list on a request failure instead of throwing", async () => {
    mockRequestUrlSequence([errorResponse(400, "boom")]);
    const voices = await listChirp3Voices("AIza-test");
    expect(voices).toEqual([]);
  });

  it("respects an AbortSignal", async () => {
    const controller = new AbortController();
    controller.abort();
    mockRequestUrlSequence([fakeResponse(200, { voices: [] })]);
    const voices = await listChirp3Voices("AIza-test", controller.signal);
    expect(voices).toEqual([]);
  });
});
