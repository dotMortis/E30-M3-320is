import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorResponse, fakeResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import { resetObsidianMocks } from "../mocks/obsidian";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let requestUrlWithRetry: typeof import("../../http/retry").requestUrlWithRetry;
let RETRYABLE_STATUSES: typeof import("../../http/retry").RETRYABLE_STATUSES;

beforeEach(async () => {
  resetObsidianMocks();
  ({ requestUrlWithRetry, RETRYABLE_STATUSES } = await import("../../http/retry"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RETRYABLE_STATUSES", () => {
  it("contains exactly the transient/server-load status codes", () => {
    expect([...RETRYABLE_STATUSES].sort()).toEqual([429, 500, 502, 503, 504]);
  });

  it("does not include client-error codes that should never be retried", () => {
    for (const status of [400, 401, 403, 404]) {
      expect(RETRYABLE_STATUSES.has(status)).toBe(false);
    }
  });
});

describe("requestUrlWithRetry", () => {
  it("returns the response immediately on a successful (< 400) status", async () => {
    mockRequestUrlSequence([fakeResponse(200, { ok: true })]);
    const response = await requestUrlWithRetry({ url: "https://example.com" });
    expect(response.status).toBe(200);
    expect(requestUrl).toHaveBeenCalledTimes(1);
  });

  it("passes throw: false through to the underlying requestUrl call", async () => {
    mockRequestUrlSequence([fakeResponse(200, {})]);
    await requestUrlWithRetry({ url: "https://example.com", method: "POST" });
    expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({ throw: false, method: "POST" }));
  });

  it("throws immediately on a non-retryable 4xx without waiting", async () => {
    mockRequestUrlSequence([errorResponse(400, "bad request")]);
    await expect(requestUrlWithRetry({ url: "https://example.com" })).rejects.toThrow(
      "Request failed, status 400: bad request"
    );
    expect(requestUrl).toHaveBeenCalledTimes(1);
  });

  it("retries on a retryable status and succeeds on the second attempt", async () => {
    vi.useFakeTimers();
    mockRequestUrlSequence([errorResponse(503, "overloaded"), fakeResponse(200, { ok: true })]);

    const promise = requestUrlWithRetry({ url: "https://example.com" });
    await vi.advanceTimersByTimeAsync(4000);
    const response = await promise;

    expect(response.status).toBe(200);
    expect(requestUrl).toHaveBeenCalledTimes(2);
  });

  it("calls onStatus with a progress label on each retry", async () => {
    vi.useFakeTimers();
    mockRequestUrlSequence([errorResponse(429, "rate limited"), fakeResponse(200, {})]);
    const onStatus = vi.fn();

    const promise = requestUrlWithRetry({ url: "https://example.com" }, { onStatus, label: "Embedding" });
    await vi.advanceTimersByTimeAsync(4000);
    await promise;

    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(onStatus.mock.calls[0][0]).toContain("Embedding überlastet (Status 429)");
  });

  it("throws after exhausting MAX_ATTEMPTS (3) retryable failures", async () => {
    vi.useFakeTimers();
    mockRequestUrlSequence([errorResponse(503, "a"), errorResponse(503, "b"), errorResponse(503, "c")]);

    const promise = requestUrlWithRetry({ url: "https://example.com" });
    const expectation = expect(promise).rejects.toThrow("Request failed, status 503: c");
    await vi.advanceTimersByTimeAsync(8000);
    await expectation;

    expect(requestUrl).toHaveBeenCalledTimes(3);
  });

  it("falls back to a text snippet when the error body isn't valid JSON", async () => {
    mockRequestUrlSequence([fakeResponse(400, undefined, "plain text error body")]);
    await expect(requestUrlWithRetry({ url: "https://example.com" })).rejects.toThrow(
      "Request failed, status 400: plain text error body"
    );
  });

  it("omits the message suffix entirely when no error message can be extracted", async () => {
    mockRequestUrlSequence([fakeResponse(400, undefined, "")]);
    await expect(requestUrlWithRetry({ url: "https://example.com" })).rejects.toThrow("Request failed, status 400");
  });

  it("retries a rejecting (network-level failure) requestUrl call and succeeds on the next attempt", async () => {
    vi.useFakeTimers();
    requestUrl.mockRejectedValueOnce(new Error("getaddrinfo ENOTFOUND"));
    requestUrl.mockResolvedValueOnce(fakeResponse(200, { ok: true }));

    const promise = requestUrlWithRetry({ url: "https://example.com" });
    await vi.advanceTimersByTimeAsync(4000);
    const response = await promise;

    expect(response.status).toBe(200);
    expect(requestUrl).toHaveBeenCalledTimes(2);
  });

  it("gives up after MAX_ATTEMPTS network-level rejections with a descriptive error", async () => {
    vi.useFakeTimers();
    requestUrl.mockRejectedValue(new Error("connection reset"));

    const promise = requestUrlWithRetry({ url: "https://example.com" }, { label: "Generierung" });
    const expectation = expect(promise).rejects.toThrow("Generierung fehlgeschlagen: connection reset");
    await vi.advanceTimersByTimeAsync(8000);
    await expectation;

    expect(requestUrl).toHaveBeenCalledTimes(3);
  });

  it("times out and retries a request that never resolves", async () => {
    vi.useFakeTimers();
    requestUrl.mockReturnValueOnce(new Promise(() => {})); // never resolves
    requestUrl.mockResolvedValueOnce(fakeResponse(200, { ok: true }));

    const promise = requestUrlWithRetry({ url: "https://example.com" });
    await vi.advanceTimersByTimeAsync(30_000); // exceeds HTTP_REQUEST_TIMEOUT_MS
    await vi.advanceTimersByTimeAsync(4000); // retry backoff delay
    const response = await promise;

    expect(response.status).toBe(200);
    expect(requestUrl).toHaveBeenCalledTimes(2);
  });

  it("grows the retry delay across successive attempts (exponential backoff)", async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(global, "setTimeout");
    mockRequestUrlSequence([errorResponse(503, "a"), errorResponse(503, "b"), fakeResponse(200, {})]);

    const promise = requestUrlWithRetry({ url: "https://example.com" });
    await vi.advanceTimersByTimeAsync(30_000);
    await promise;

    // Filter out the per-attempt timeout timers (HTTP_REQUEST_TIMEOUT_MS) to
    // isolate the two backoff-sleep delays between the three attempts.
    const sleepDelays = setTimeoutSpy.mock.calls.map((call) => call[1] as number).filter((ms) => ms < 10_000);
    expect(sleepDelays).toHaveLength(2);
    expect(sleepDelays[1]).toBeGreaterThan(sleepDelays[0]);
  });

  it("rejects immediately without calling requestUrl when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      requestUrlWithRetry({ url: "https://example.com" }, { signal: controller.signal })
    ).rejects.toThrow("Anfrage abgebrochen.");
    expect(requestUrl).not.toHaveBeenCalled();
  });

  it("aborts an in-flight request immediately, without waiting for the timeout", async () => {
    requestUrl.mockReturnValueOnce(new Promise(() => {}));
    const controller = new AbortController();

    const promise = requestUrlWithRetry({ url: "https://example.com" }, { signal: controller.signal });
    controller.abort();

    await expect(promise).rejects.toThrow("Anfrage abgebrochen.");
  });

  it("aborts during the retry backoff sleep, without waiting out the delay", async () => {
    mockRequestUrlSequence([errorResponse(503, "overloaded"), errorResponse(503, "overloaded again")]);
    const controller = new AbortController();

    const promise = requestUrlWithRetry({ url: "https://example.com" }, { signal: controller.signal });
    await vi.waitFor(() => expect(requestUrl).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();

    await expect(promise).rejects.toThrow("Anfrage abgebrochen.");
  });

  it("treats 429 as retryable, respecting a Retry-After header (in seconds) over the computed backoff", async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(global, "setTimeout");
    const rateLimited = fakeResponse(429, { error: { message: "rate limited" } });
    rateLimited.headers = { "retry-after": "5" };
    mockRequestUrlSequence([rateLimited, fakeResponse(200, {})]);

    const promise = requestUrlWithRetry({ url: "https://example.com" });
    await vi.advanceTimersByTimeAsync(5000);
    await promise;

    const sleepDelays = setTimeoutSpy.mock.calls.map((call) => call[1] as number).filter((ms) => ms < 10_000);
    expect(sleepDelays).toEqual([5000]);
  });
});
