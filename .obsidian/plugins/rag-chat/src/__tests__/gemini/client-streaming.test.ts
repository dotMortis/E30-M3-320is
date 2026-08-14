import { describe, expect, it, vi } from "vitest";
import { makeFakeSseFetch, sseFrame } from "../mocks/fetch-sse";
import { CONTENTS, SEARCH_MANUAL, fakeSettings, generateWithTools, generateWithToolsStreaming } from "./client-harness";

describe("generateWithToolsStreaming", () => {
  it("throws immediately when no API key is set, without a network call", async () => {
    const fetchImpl = makeFakeSseFetch({ reads: [{ done: true }] });
    await expect(
      generateWithToolsStreaming(CONTENTS, null, fakeSettings({ geminiApiKey: "" }), {
        onDelta: vi.fn(),
        fetchImpl: fetchImpl as any,
      } as any)
    ).rejects.toThrow("Google API key is required");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts to the streamGenerateContent endpoint with alt=sse for the configured model", async () => {
    const fetchImpl = makeFakeSseFetch({ reads: [{ value: sseFrame({ candidates: [{ content: { parts: [{ text: "Antwort" }] } }] }) }, { done: true }] });
    await generateWithToolsStreaming(CONTENTS, null, fakeSettings({ generationModel: "gemini-3.6-flash" }), {
      onDelta: vi.fn(),
      fetchImpl: fetchImpl as any,
    });
    const [url] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse"
    );
  });

  it("builds the same request body shape as generateWithTools (tools/thinking/system instruction)", async () => {
    const fetchImpl = makeFakeSseFetch({ reads: [{ value: sseFrame({ candidates: [{ content: { parts: [{ text: "x" }] } }] }) }, { done: true }] });
    await generateWithToolsStreaming(CONTENTS, [SEARCH_MANUAL], fakeSettings(), {
      includeGoogleSearch: true,
      thinkingEnabled: true,
      onDelta: vi.fn(),
      fetchImpl: fetchImpl as any,
    });
    const [, init] = fetchImpl.mock.calls[0];
    const body = JSON.parse((init as { body: string }).body);
    expect(body.tools).toEqual([{ google_search: {} }, { functionDeclarations: [SEARCH_MANUAL] }]);
    expect(body.generationConfig).toBeUndefined();
    expect(body.systemInstruction.parts[0].text).toContain("Web-Rechercheergebnissen");
  });

  it("invokes onDelta once per incremental text part as chunks arrive", async () => {
    const fetchImpl = makeFakeSseFetch({
      reads: [
        { value: sseFrame({ candidates: [{ content: { parts: [{ text: "Zylinderkopf" }] } }] }) },
        { value: sseFrame({ candidates: [{ content: { parts: [{ text: "schrauben: 30 Nm." }] }, finishReason: "STOP" }] }) },
        { done: true },
      ],
    });
    const onDelta = vi.fn();

    const result = await generateWithToolsStreaming(CONTENTS, null, fakeSettings(), { onDelta, fetchImpl: fetchImpl as any });

    expect(onDelta.mock.calls).toEqual([["Zylinderkopf"], ["schrauben: 30 Nm."]]);
    expect(result.parts).toEqual([{ text: "Zylinderkopf" }, { text: "schrauben: 30 Nm." }]);
    expect(result.finishReason).toBe("STOP");
  });

  it("accumulates functionCall parts without invoking onDelta for them", async () => {
    const fetchImpl = makeFakeSseFetch({
      reads: [
        {
          value: sseFrame({
            candidates: [{ content: { parts: [{ functionCall: { name: "search_manual", args: { query: "Bremse" } } }] } }],
          }),
        },
        { done: true },
      ],
    });
    const onDelta = vi.fn();

    const result = await generateWithToolsStreaming(CONTENTS, [SEARCH_MANUAL], fakeSettings(), {
      onDelta,
      fetchImpl: fetchImpl as any,
    });

    expect(onDelta).not.toHaveBeenCalled();
    expect(result.parts).toEqual([{ functionCall: { name: "search_manual", args: { query: "Bremse" } } }]);
  });

  it("uses the latest chunk's groundingMetadata (final chunk carries the complete grounding)", async () => {
    const fetchImpl = makeFakeSseFetch({
      reads: [
        { value: sseFrame({ candidates: [{ content: { parts: [{ text: "Antwort" }] } }] }) },
        {
          value: sseFrame({
            candidates: [
              {
                content: { parts: [] },
                groundingMetadata: {
                  groundingChunks: [{ web: { uri: "https://example.com", title: "Example" } }],
                  groundingSupports: [{ segment: { endIndex: 5 }, groundingChunkIndices: [0] }],
                },
              },
            ],
          }),
        },
        { done: true },
      ],
    });

    const result = await generateWithToolsStreaming(CONTENTS, null, fakeSettings(), { onDelta: vi.fn(), fetchImpl: fetchImpl as any });

    expect(result.groundingChunks).toEqual([{ uri: "https://example.com", title: "Example" }]);
    expect(result.groundingSupports).toEqual([{ startIndex: 0, endIndex: 5, chunkIndices: [0], text: undefined }]);
  });

  it("throws a SAFETY block error when no parts were ever received", async () => {
    const fetchImpl = makeFakeSseFetch({
      reads: [{ value: sseFrame({ candidates: [{ content: { parts: [] }, finishReason: "SAFETY" }] }) }, { done: true }],
    });

    await expect(
      generateWithToolsStreaming(CONTENTS, null, fakeSettings(), { onDelta: vi.fn(), fetchImpl: fetchImpl as any })
    ).rejects.toThrow("SAFETY");
  });

  it("throws a clean error when the stream ends with no parts and no block reason", async () => {
    const fetchImpl = makeFakeSseFetch({ reads: [{ done: true }] });

    await expect(
      generateWithToolsStreaming(CONTENTS, null, fakeSettings(), { onDelta: vi.fn(), fetchImpl: fetchImpl as any })
    ).rejects.toThrow("Unexpected streamGenerateContent response: no parts received.");
  });

  it("forwards the signal, aborting immediately instead of waiting for a response", async () => {
    const fetchImpl = makeFakeSseFetch({ reads: [{ neverResolves: true }] });
    const controller = new AbortController();
    const promise = generateWithToolsStreaming(CONTENTS, null, fakeSettings(), {
      onDelta: vi.fn(),
      fetchImpl: fetchImpl as any,
      signal: controller.signal,
    });
    controller.abort();
    await expect(promise).rejects.toThrow("Anfrage abgebrochen.");
  });
});
