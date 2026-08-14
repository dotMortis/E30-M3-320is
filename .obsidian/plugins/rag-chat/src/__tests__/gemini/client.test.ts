import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeResponse, generateContentResponse, errorResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import { resetObsidianMocks } from "../mocks/obsidian";
import { fakeSettings } from "../fixtures/settings";
import type { FunctionDeclaration, GeminiContent } from "../../gemini/types";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let generateWithTools: typeof import("../../gemini/client").generateWithTools;

beforeEach(async () => {
  resetObsidianMocks();
  ({ generateWithTools } = await import("../../gemini/client"));
});

const CONTENTS: GeminiContent[] = [{ role: "user", parts: [{ text: "Anzugsdrehmoment?" }] }];
const SEARCH_MANUAL: FunctionDeclaration = { name: "search_manual", description: "d", parameters: {} };

describe("generateWithTools", () => {
  it("throws immediately when no API key is set, without a network call", async () => {
    await expect(generateWithTools(CONTENTS, null, fakeSettings({ geminiApiKey: "" }))).rejects.toThrow(
      "Google API key is required"
    );
    expect(requestUrl).not.toHaveBeenCalled();
  });

  it("posts to the generateContent endpoint for the configured model", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings({ generationModel: "gemini-3.6-flash" }));
    const call = requestUrl.mock.calls[0][0] as { url: string; method: string };
    expect(call.url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent");
    expect(call.method).toBe("POST");
  });

  it("includes google_search in tools by default", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings());
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.tools).toEqual([{ google_search: {} }]);
  });

  it("excludes google_search when includeGoogleSearch is false", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings(), { includeGoogleSearch: false });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.tools).toBeUndefined();
  });

  it("includes functionDeclarations in tools when provided", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, [SEARCH_MANUAL], fakeSettings(), { includeGoogleSearch: false });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.tools).toEqual([{ functionDeclarations: [SEARCH_MANUAL] }]);
  });

  it("sets toolConfig.includeServerSideToolInvocations when any tools are present", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings());
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.toolConfig).toEqual({ includeServerSideToolInvocations: true });
  });

  it("omits tools and toolConfig entirely when no tools are declared", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings(), { includeGoogleSearch: false });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.tools).toBeUndefined();
    expect(body.toolConfig).toBeUndefined();
  });

  it("builds the systemInstruction from SYSTEM_PROMPT plus the tools suffix for this exact call", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, [SEARCH_MANUAL], fakeSettings());
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.systemInstruction.parts[0].text).toContain("Antworte auf Deutsch.");
    expect(body.systemInstruction.parts[0].text).toContain("search_manual(query):");
  });

  it("returns the response's parts", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Zylinderkopfschrauben: 30 Nm." })]);
    const result = await generateWithTools(CONTENTS, null, fakeSettings());
    expect(result.parts).toEqual([{ text: "Zylinderkopfschrauben: 30 Nm." }]);
  });

  it("returns functionCall parts alongside/instead of text parts", async () => {
    mockRequestUrlSequence([
      generateContentResponse({ functionCalls: [{ name: "search_manual", args: { query: "Bremse" } }] }),
    ]);
    const result = await generateWithTools(CONTENTS, [SEARCH_MANUAL], fakeSettings());
    expect(result.parts).toEqual([{ functionCall: { name: "search_manual", args: { query: "Bremse" } } }]);
  });

  it("throws when the response has no parts at all", async () => {
    mockRequestUrlSequence([errorResponse(200, "irrelevant")]);
    await expect(generateWithTools(CONTENTS, null, fakeSettings())).rejects.toThrow(
      "Unexpected generateContent response shape"
    );
  });

  it("throws a clean error instead of an uncaught parse exception when response.json is not valid JSON", async () => {
    mockRequestUrlSequence([fakeResponse(200, undefined, "not valid json {{{")]);
    await expect(generateWithTools(CONTENTS, null, fakeSettings())).rejects.toThrow(
      "Antwort konnte nicht als JSON gelesen werden"
    );
  });

  it("surfaces an actionable SAFETY-block error instead of a generic shape-mismatch throw", async () => {
    mockRequestUrlSequence([
      fakeResponse(200, { candidates: [{ content: { parts: [] }, finishReason: "SAFETY" }] }),
    ]);
    await expect(generateWithTools(CONTENTS, null, fakeSettings())).rejects.toThrow("SAFETY");
  });

  it("surfaces an actionable RECITATION-block error", async () => {
    mockRequestUrlSequence([
      fakeResponse(200, { candidates: [{ content: { parts: [] }, finishReason: "RECITATION" }] }),
    ]);
    await expect(generateWithTools(CONTENTS, null, fakeSettings())).rejects.toThrow("RECITATION");
  });

  it("surfaces an actionable MAX_TOKENS error when finishReason is MAX_TOKENS and there are no parts", async () => {
    mockRequestUrlSequence([
      fakeResponse(200, { candidates: [{ content: { parts: [] }, finishReason: "MAX_TOKENS" }] }),
    ]);
    await expect(generateWithTools(CONTENTS, null, fakeSettings())).rejects.toThrow("MAX_TOKENS");
  });

  it("surfaces promptFeedback.blockReason even when there are no candidates at all", async () => {
    mockRequestUrlSequence([fakeResponse(200, { promptFeedback: { blockReason: "SAFETY" }, candidates: [] })]);
    await expect(generateWithTools(CONTENTS, null, fakeSettings())).rejects.toThrow("SAFETY");
  });

  it("does not treat a normal STOP finishReason with empty parts as a safety block (falls through to shape-mismatch)", async () => {
    mockRequestUrlSequence([
      fakeResponse(200, { candidates: [{ content: { parts: [] }, finishReason: "STOP" }] }),
    ]);
    await expect(generateWithTools(CONTENTS, null, fakeSettings())).rejects.toThrow(
      "Unexpected generateContent response shape"
    );
  });

  it("returns an empty groundingChunks/groundingSupports when there is no groundingMetadata", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    const result = await generateWithTools(CONTENTS, null, fakeSettings());
    expect(result.groundingChunks).toEqual([]);
    expect(result.groundingSupports).toEqual([]);
  });

  it("maps groundingChunks, falling back to uri as the title when title is missing", async () => {
    mockRequestUrlSequence([
      generateContentResponse({
        text: "Antwort",
        groundingChunks: [{ uri: "https://example.com" }],
      }),
    ]);
    const result = await generateWithTools(CONTENTS, null, fakeSettings());
    expect(result.groundingChunks[0]).toEqual({ uri: "https://example.com", title: "https://example.com" });
  });

  it("maps groundingSupports, defaulting startIndex to 0 when missing", async () => {
    mockRequestUrlSequence([
      generateContentResponse({
        text: "Antwort",
        groundingChunks: [{ uri: "https://example.com", title: "Example" }],
        groundingSupports: [{ endIndex: 10, chunkIndices: [0], text: "excerpt" }],
      }),
    ]);
    const result = await generateWithTools(CONTENTS, null, fakeSettings());
    expect(result.groundingSupports).toEqual([{ startIndex: 0, endIndex: 10, chunkIndices: [0], text: "excerpt" }]);
  });

  it("filters out a groundingSupport with no groundingChunkIndices", async () => {
    mockRequestUrlSequence([
      generateContentResponse({
        text: "Antwort",
        groundingChunks: [{ uri: "https://example.com", title: "Example" }],
        groundingSupports: [{ endIndex: 10, chunkIndices: [], text: "excerpt" }],
      }),
    ]);
    const result = await generateWithTools(CONTENTS, null, fakeSettings());
    expect(result.groundingSupports).toEqual([]);
  });

  it("returns the finishReason from the candidate", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort", finishReason: "STOP" })]);
    const result = await generateWithTools(CONTENTS, null, fakeSettings());
    expect(result.finishReason).toBe("STOP");
  });

  it("forwards onStatus to the retry wrapper", async () => {
    mockRequestUrlSequence([errorResponse(503, "overloaded"), generateContentResponse({ text: "Antwort" })]);
    const onStatus = vi.fn();
    vi.useFakeTimers();
    const promise = generateWithTools(CONTENTS, null, fakeSettings(), { onStatus });
    await vi.advanceTimersByTimeAsync(4000);
    await promise;
    vi.useRealTimers();
    expect(onStatus).toHaveBeenCalled();
    expect(onStatus.mock.calls[0][0]).toContain("Generierung überlastet");
  });
});
