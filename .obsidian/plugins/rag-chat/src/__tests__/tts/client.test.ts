import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorResponse, fakeResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import { resetObsidianMocks } from "../mocks/obsidian";
import { fakeSettings } from "../fixtures/settings";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let synthesizeSpeech: typeof import("../../tts/client").synthesizeSpeech;

beforeEach(async () => {
  resetObsidianMocks();
  ({ synthesizeSpeech } = await import("../../tts/client"));
});

describe("synthesizeSpeech", () => {
  it("throws immediately when neither ttsApiKey nor geminiApiKey is set, without a network call", async () => {
    await expect(synthesizeSpeech("Text", fakeSettings({ geminiApiKey: "", ttsApiKey: "" }))).rejects.toThrow(
      "Google API key is required"
    );
    expect(requestUrl).not.toHaveBeenCalled();
  });

  it("posts to the text:synthesize endpoint with the shaped request body", async () => {
    mockRequestUrlSequence([fakeResponse(200, { audioContent: "QUJD" })]);
    await synthesizeSpeech("Zylinderkopfschrauben: 30 Nm.", fakeSettings({
      ttsLanguageCode: "de-DE",
      ttsVoiceName: "de-DE-Chirp3-HD-Laomedeia",
    }));
    const call = requestUrl.mock.calls[0][0] as { url: string; method: string; body: string };
    expect(call.url).toBe("https://texttospeech.googleapis.com/v1/text:synthesize");
    expect(call.method).toBe("POST");
    expect(JSON.parse(call.body)).toEqual({
      input: { text: "Zylinderkopfschrauben: 30 Nm." },
      voice: { languageCode: "de-DE", name: "de-DE-Chirp3-HD-Laomedeia" },
      audioConfig: { audioEncoding: "MP3" },
    });
  });

  it("uses ttsApiKey via the X-Goog-Api-Key header when set", async () => {
    mockRequestUrlSequence([fakeResponse(200, { audioContent: "QUJD" })]);
    await synthesizeSpeech("Text", fakeSettings({ ttsApiKey: "tts-only-key", geminiApiKey: "gemini-key" }));
    const call = requestUrl.mock.calls[0][0] as { headers: Record<string, string> };
    expect(call.headers["X-Goog-Api-Key"]).toBe("tts-only-key");
  });

  it("falls back to geminiApiKey when ttsApiKey is empty", async () => {
    mockRequestUrlSequence([fakeResponse(200, { audioContent: "QUJD" })]);
    await synthesizeSpeech("Text", fakeSettings({ ttsApiKey: "", geminiApiKey: "gemini-key" }));
    const call = requestUrl.mock.calls[0][0] as { headers: Record<string, string> };
    expect(call.headers["X-Goog-Api-Key"]).toBe("gemini-key");
  });

  it("returns the base64 audioContent from the response", async () => {
    mockRequestUrlSequence([fakeResponse(200, { audioContent: "QUJD" })]);
    const audio = await synthesizeSpeech("Text", fakeSettings());
    expect(audio).toBe("QUJD");
  });

  it("maps an HTTP 403 to a clear German error about billing/API enablement", async () => {
    mockRequestUrlSequence([errorResponse(403, "Permission denied")]);
    await expect(synthesizeSpeech("Text", fakeSettings())).rejects.toThrow(
      "Cloud Text-to-Speech API und Billing im Projekt dieses API-Keys aktivieren"
    );
  });

  it("throws a descriptive error when the response has no audioContent", async () => {
    mockRequestUrlSequence([fakeResponse(200, { unexpected: true })]);
    await expect(synthesizeSpeech("Text", fakeSettings())).rejects.toThrow("Unexpected text:synthesize response shape");
  });
});
