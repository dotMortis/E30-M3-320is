import { beforeEach, describe, expect, it, vi } from "vitest";
import { embedContentResponse, errorResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import { resetObsidianMocks } from "../mocks/obsidian";
import { fakeSettings } from "../fixtures/settings";
import { fakeManifest } from "../fixtures/manifest";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let embedQuery: typeof import("../../retrieval/embeddings").embedQuery;
let validateManifest: typeof import("../../retrieval/embeddings").validateManifest;

beforeEach(async () => {
  resetObsidianMocks();
  ({ embedQuery, validateManifest } = await import("../../retrieval/embeddings"));
});

describe("validateManifest", () => {
  it("returns no warnings when the manifest matches settings exactly", () => {
    expect(validateManifest(fakeManifest(), fakeSettings())).toEqual([]);
  });

  it("warns when the embedding model differs", () => {
    const warnings = validateManifest(fakeManifest({ embeddingModel: "gemini-embedding-1" }), fakeSettings());
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("gemini-embedding-1");
  });

  it("warns when the embedding dims differ", () => {
    const warnings = validateManifest(fakeManifest({ embeddingDims: 768 }), fakeSettings({ outputDim: 3072 }));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("768");
  });

  it("returns both warnings when model and dims both differ", () => {
    const warnings = validateManifest(
      fakeManifest({ embeddingModel: "old-model", embeddingDims: 768 }),
      fakeSettings({ outputDim: 3072 })
    );
    expect(warnings).toHaveLength(2);
  });
});

describe("embedQuery", () => {
  it("throws immediately when no API key is set, without making a network call", async () => {
    await expect(embedQuery("Anzugsdrehmoment", fakeSettings({ geminiApiKey: "" }))).rejects.toThrow(
      "Google API key"
    );
    expect(requestUrl).not.toHaveBeenCalled();
  });

  it("returns the embedding values array from a successful response", async () => {
    const vector = [0.1, 0.2, 0.3];
    mockRequestUrlSequence([embedContentResponse(vector)]);
    const result = await embedQuery("Anzugsdrehmoment Zylinderkopf", fakeSettings());
    expect(result).toEqual(vector);
  });

  it("sends the query wrapped in the query-prefix template", async () => {
    mockRequestUrlSequence([embedContentResponse([0.1])]);
    await embedQuery("Anzugsdrehmoment", fakeSettings());
    const call = requestUrl.mock.calls[0][0] as { body: string };
    const body = JSON.parse(call.body);
    expect(body.content.parts[0].text).toBe("task: search result | query: Anzugsdrehmoment");
  });

  it("sends the API key as the x-goog-api-key header and the model in the URL", async () => {
    mockRequestUrlSequence([embedContentResponse([0.1])]);
    await embedQuery("q", fakeSettings({ geminiApiKey: "secret-key", embeddingModel: "gemini-embedding-2" }));
    const call = requestUrl.mock.calls[0][0] as { url: string; headers: Record<string, string> };
    expect(call.headers["x-goog-api-key"]).toBe("secret-key");
    expect(call.url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent");
  });

  it("sends settings.outputDim as outputDimensionality", async () => {
    mockRequestUrlSequence([embedContentResponse([0.1])]);
    await embedQuery("q", fakeSettings({ outputDim: 768 }));
    const call = requestUrl.mock.calls[0][0] as { body: string };
    expect(JSON.parse(call.body).outputDimensionality).toBe(768);
  });

  it("throws a descriptive error when the response shape is unexpected", async () => {
    mockRequestUrlSequence([errorResponse(200, "ignored")]);
    await expect(embedQuery("q", fakeSettings())).rejects.toThrow("Unexpected embedContent response shape");
  });

  it("propagates a non-retryable HTTP error from the retry wrapper", async () => {
    mockRequestUrlSequence([errorResponse(400, "invalid request")]);
    await expect(embedQuery("q", fakeSettings())).rejects.toThrow("Request failed, status 400");
  });

  it("forwards the signal to the retry wrapper, aborting immediately instead of waiting for a response", async () => {
    requestUrl.mockReturnValueOnce(new Promise(() => {}));
    const controller = new AbortController();
    const promise = embedQuery("q", fakeSettings(), undefined, controller.signal);
    controller.abort();
    await expect(promise).rejects.toThrow("Anfrage abgebrochen.");
  });
});
