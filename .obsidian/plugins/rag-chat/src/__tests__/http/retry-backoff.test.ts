import { describe, expect, it, vi } from "vitest";
import { errorResponse, fakeResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import { requestUrlWithRetry } from "./retry-harness";

describe("requestUrlWithRetry (timeouts & backoff)", () => {
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

  it("gives up after HTTP_MAX_ATTEMPTS (5) network-level rejections with a descriptive error", async () => {
    vi.useFakeTimers();
    requestUrl.mockRejectedValue(new Error("connection reset"));

    const promise = requestUrlWithRetry({ url: "https://example.com" }, { label: "Generierung" });
    const expectation = expect(promise).rejects.toThrow("Generierung fehlgeschlagen: connection reset");
    await vi.advanceTimersByTimeAsync(20_000);
    await expectation;

    expect(requestUrl).toHaveBeenCalledTimes(5);
  });

  it("times out and retries a request that never resolves", async () => {
    vi.useFakeTimers();
    requestUrl.mockReturnValueOnce(new Promise(() => {}));
    requestUrl.mockResolvedValueOnce(fakeResponse(200, { ok: true }));

    const promise = requestUrlWithRetry({ url: "https://example.com" });
    await vi.advanceTimersByTimeAsync(46_000);
    await vi.advanceTimersByTimeAsync(4000);
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
