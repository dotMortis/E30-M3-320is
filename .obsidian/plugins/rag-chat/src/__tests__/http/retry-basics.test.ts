import { describe, expect, it, vi } from "vitest";
import { errorResponse, fakeResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import { requestUrlWithRetry, RETRYABLE_STATUSES } from "./retry-harness";

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

    expect(onStatus).toHaveBeenCalled();
    expect(onStatus.mock.calls[0][0]).toContain("Embedding überlastet (Status 429)");
  });

  it("counts down the remaining seconds live during the retry wait instead of staying frozen", async () => {
    vi.useFakeTimers();
    const rateLimited = fakeResponse(429, { error: { message: "rate limited" } });
    rateLimited.headers = { "retry-after": "3" };
    mockRequestUrlSequence([rateLimited, fakeResponse(200, {})]);
    const onStatus = vi.fn();

    const promise = requestUrlWithRetry({ url: "https://example.com" }, { onStatus });
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(1000);
    await promise;

    const messages = onStatus.mock.calls.map((call) => call[0] as string);
    expect(messages[0]).toContain("in 3s");
    expect(messages.some((m) => m.includes("in 2s"))).toBe(true);
    expect(messages.some((m) => m.includes("in 1s"))).toBe(true);

    expect(messages.some((m) => m.includes("in 0s"))).toBe(false);
  });

  it("throws after exhausting all HTTP_MAX_ATTEMPTS (5) retryable failures", async () => {
    vi.useFakeTimers();
    mockRequestUrlSequence([
      errorResponse(503, "a"),
      errorResponse(503, "b"),
      errorResponse(503, "c"),
      errorResponse(503, "d"),
      errorResponse(503, "e"),
    ]);

    const promise = requestUrlWithRetry({ url: "https://example.com" });
    const expectation = expect(promise).rejects.toThrow("Request failed, status 503: e");

    await vi.advanceTimersByTimeAsync(20_000);
    await expectation;

    expect(requestUrl).toHaveBeenCalledTimes(5);
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

});
