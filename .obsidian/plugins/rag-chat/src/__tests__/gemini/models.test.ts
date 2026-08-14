import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorResponse, listModelsResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import { resetObsidianMocks } from "../mocks/obsidian";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let listFlashModels: typeof import("../../gemini/models").listFlashModels;

beforeEach(async () => {
  resetObsidianMocks();
  ({ listFlashModels } = await import("../../gemini/models"));
});

describe("listFlashModels", () => {
  it("returns an empty list without a network call when no API key is set", async () => {
    const models = await listFlashModels("");
    expect(models).toEqual([]);
    expect(requestUrl).not.toHaveBeenCalled();
  });

  it("filters to models whose name contains 'flash' and support generateContent", async () => {
    mockRequestUrlSequence([
      listModelsResponse([
        { name: "models/gemini-3.6-flash", displayName: "Gemini 3.6 Flash", supportedGenerationMethods: ["generateContent"] },
        { name: "models/gemini-3.6-pro", displayName: "Gemini 3.6 Pro", supportedGenerationMethods: ["generateContent"] },
        { name: "models/gemini-embedding-2", displayName: "Gemini Embedding 2", supportedGenerationMethods: ["embedContent"] },
        { name: "models/gemini-3.6-flash-lite", displayName: "Gemini 3.6 Flash Lite", supportedGenerationMethods: ["countTokens"] },
      ]),
    ]);
    const models = await listFlashModels("AIza-test");
    expect(models).toEqual([{ id: "gemini-3.6-flash", displayName: "Gemini 3.6 Flash" }]);
  });

  it("excludes preview and tts flash models, keeping only stable chat models", async () => {
    mockRequestUrlSequence([
      listModelsResponse([
        { name: "models/gemini-3.6-flash", displayName: "Gemini 3.6 Flash", supportedGenerationMethods: ["generateContent"] },
        {
          name: "models/gemini-3.6-flash-preview",
          displayName: "Gemini 3.6 Flash Preview",
          supportedGenerationMethods: ["generateContent"],
        },
        {
          name: "models/gemini-2.5-flash-preview-tts",
          displayName: "Gemini 2.5 Flash Preview TTS",
          supportedGenerationMethods: ["generateContent"],
        },
        {
          name: "models/gemini-2.5-flash-native-audio-preview-tts",
          displayName: "Gemini 2.5 Flash Native Audio",
          supportedGenerationMethods: ["generateContent"],
        },
      ]),
    ]);
    const models = await listFlashModels("AIza-test");
    expect(models).toEqual([{ id: "gemini-3.6-flash", displayName: "Gemini 3.6 Flash" }]);
  });

  it("falls back to the bare model id when displayName is missing", async () => {
    mockRequestUrlSequence([
      listModelsResponse([{ name: "models/gemini-3.6-flash", supportedGenerationMethods: ["generateContent"] }]),
    ]);
    const models = await listFlashModels("AIza-test");
    expect(models).toEqual([{ id: "gemini-3.6-flash", displayName: "gemini-3.6-flash" }]);
  });

  it("follows nextPageToken across multiple pages", async () => {
    mockRequestUrlSequence([
      listModelsResponse(
        [{ name: "models/gemini-3.6-flash", supportedGenerationMethods: ["generateContent"] }],
        "page-2"
      ),
      listModelsResponse([{ name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] }]),
    ]);
    const models = await listFlashModels("AIza-test");
    expect(models.map((m) => m.id)).toEqual(["gemini-3.6-flash", "gemini-2.5-flash"]);
    expect(requestUrl).toHaveBeenCalledTimes(2);
    const secondCall = requestUrl.mock.calls[1][0] as { url: string };
    expect(secondCall.url).toContain("pageToken=page-2");
  });

  it("sends the API key via the x-goog-api-key header", async () => {
    mockRequestUrlSequence([listModelsResponse([])]);
    await listFlashModels("AIza-test");
    const call = requestUrl.mock.calls[0][0] as { headers: Record<string, string> };
    expect(call.headers["x-goog-api-key"]).toBe("AIza-test");
  });

  it("returns an empty list on a request failure instead of throwing", async () => {
    mockRequestUrlSequence([errorResponse(400, "boom")]);
    const models = await listFlashModels("AIza-test");
    expect(models).toEqual([]);
  });

  it("respects an AbortSignal", async () => {
    const controller = new AbortController();
    controller.abort();
    mockRequestUrlSequence([listModelsResponse([])]);
    const models = await listFlashModels("AIza-test", controller.signal);
    expect(models).toEqual([]);
  });
});
