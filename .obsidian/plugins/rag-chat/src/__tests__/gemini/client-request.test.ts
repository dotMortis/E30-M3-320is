import { describe, expect, it, vi } from "vitest";
import { generateContentResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import { CONTENTS, SEARCH_MANUAL, fakeSettings, generateWithTools } from "./client-harness";

describe("generateWithTools request shape", () => {
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

  it("excludes google_search by default (opt-in only)", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings());
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.tools).toBeUndefined();
  });

  it("includes google_search when includeGoogleSearch is true", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings(), { includeGoogleSearch: true });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.tools).toEqual([{ google_search: {} }]);
  });

  it("excludes google_search when includeGoogleSearch is false", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings(), { includeGoogleSearch: false });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.tools).toBeUndefined();
  });

  it("minimizes thinking (thinkingLevel low) by default on a Gemini 3.x model", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings({ generationModel: "gemini-3.6-flash" }));
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.generationConfig).toEqual({ thinkingConfig: { thinkingLevel: "low" } });
  });

  it("minimizes thinking (thinkingLevel low) when thinkingEnabled is false on a Gemini 3.x model", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings({ generationModel: "gemini-3.6-flash" }), {
      thinkingEnabled: false,
    });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.generationConfig).toEqual({ thinkingConfig: { thinkingLevel: "low" } });
  });

  it("disables thinking (budget 0) by default on a pre-Gemini-3 model", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings({ generationModel: "gemini-2.5-flash" }));
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.generationConfig).toEqual({ thinkingConfig: { thinkingBudget: 0 } });
  });

  it("omits generationConfig/thinkingConfig entirely when thinkingEnabled is true (model's own default budget)", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings(), { thinkingEnabled: true });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.generationConfig).toBeUndefined();
  });

  it("forces thinking on when includeGoogleSearch is true, even if thinkingEnabled is false", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings({ generationModel: "gemini-3.6-flash" }), {
      includeGoogleSearch: true,
      thinkingEnabled: false,
    });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.generationConfig).toBeUndefined();
  });

  it("includes functionDeclarations in tools when provided", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, [SEARCH_MANUAL], fakeSettings(), { includeGoogleSearch: false });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.tools).toEqual([{ functionDeclarations: [SEARCH_MANUAL] }]);
  });

  it("sets toolConfig.includeServerSideToolInvocations when google_search is combined with function declarations", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, [SEARCH_MANUAL], fakeSettings(), { includeGoogleSearch: true });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.toolConfig).toEqual({ includeServerSideToolInvocations: true });
  });

  it("omits toolConfig when only custom function declarations are present (no built-in tool)", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, [SEARCH_MANUAL], fakeSettings(), { includeGoogleSearch: false });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.toolConfig).toBeUndefined();
  });

  it("omits toolConfig when only google_search is present with no function declarations", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings(), { includeGoogleSearch: true });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.toolConfig).toBeUndefined();
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

  it("omits the short/long answer format instructions when ttsRequested is not set", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings());
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.systemInstruction.parts[0].text).not.toContain("%%%SHORT_ANSWER_START%%%");
  });

  it("includes the short/long answer format instructions when ttsRequested is true", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings(), { ttsRequested: true });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.systemInstruction.parts[0].text).toContain("%%%SHORT_ANSWER_START%%%");
  });

});
