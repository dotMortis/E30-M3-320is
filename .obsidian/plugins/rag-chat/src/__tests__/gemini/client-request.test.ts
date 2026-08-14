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

  it("disables thinking (budget 0) by default", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings());
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.generationConfig).toEqual({ thinkingConfig: { thinkingBudget: 0 } });
  });

  it("disables thinking when thinkingEnabled is false", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings(), { thinkingEnabled: false });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.generationConfig).toEqual({ thinkingConfig: { thinkingBudget: 0 } });
  });

  it("omits generationConfig/thinkingConfig entirely when thinkingEnabled is true (model's own default budget)", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings(), { thinkingEnabled: true });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.generationConfig).toBeUndefined();
  });

  it("includes functionDeclarations in tools when provided", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, [SEARCH_MANUAL], fakeSettings(), { includeGoogleSearch: false });
    const body = JSON.parse((requestUrl.mock.calls[0][0] as { body: string }).body);
    expect(body.tools).toEqual([{ functionDeclarations: [SEARCH_MANUAL] }]);
  });

  it("sets toolConfig.includeServerSideToolInvocations when any tools are present", async () => {
    mockRequestUrlSequence([generateContentResponse({ text: "Antwort" })]);
    await generateWithTools(CONTENTS, null, fakeSettings(), { includeGoogleSearch: true });
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

});
