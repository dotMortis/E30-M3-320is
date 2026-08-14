import { describe, expect, it, vi } from "vitest";
import { makeFakeSseFetch, sseFrame } from "../mocks/fetch-sse";
import {
  HTTP_MAX_ATTEMPTS,
  HTTP_STREAM_FIRST_BYTE_TIMEOUT_MS,
  HTTP_STREAM_IDLE_TIMEOUT_MS,
} from "../../constants";
import { PARAMS, postSseWithRetry } from "./stream-harness";

describe("postSseWithRetry (retry & timeouts)", () => {
  it("retries a rejecting fetch() call pre-first-byte and succeeds on the next attempt", async () => {
    let call = 0;
    const second = makeFakeSseFetch({ reads: [{ value: sseFrame({ ok: true }) }, { done: true }] });
    const fetchImpl = vi.fn((url: string, init?: { signal?: AbortSignal }) => {
      if (++call === 1) throw new Error("ECONNRESET");
      return second(url, init);
    });
    const onEvent = vi.fn();

    vi.useFakeTimers();
    const promise = postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any });
    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("gives up after HTTP_MAX_ATTEMPTS retryable pre-first-byte failures", async () => {
    const fetchImpl = makeFakeSseFetch({ status: 503, bodyText: "overloaded" });
    const onEvent = vi.fn();

    vi.useFakeTimers();
    const promise = postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any });
    const expectation = expect(promise).rejects.toThrow(/status 503/);
    await vi.advanceTimersByTimeAsync(60_000);
    await expectation;

    expect(fetchImpl).toHaveBeenCalledTimes(HTTP_MAX_ATTEMPTS);
  });

  it("does NOT retry once a byte has already been delivered, even on a subsequent stall", async () => {
    const fetchImpl = makeFakeSseFetch({
      reads: [{ value: sseFrame({ partial: true }) }, { neverResolves: true }],
    });
    const onEvent = vi.fn();

    vi.useFakeTimers();
    const promise = postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any });
    const expectation = expect(promise).rejects.toThrow(/Streaming-Verbindung gestoppt/);
    await vi.advanceTimersByTimeAsync(HTTP_STREAM_IDLE_TIMEOUT_MS + 1000);
    await expectation;

    expect(onEvent).toHaveBeenCalledWith({ partial: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("times out and retries when no data arrives before the first-byte timeout", async () => {
    let call = 0;
    const second = makeFakeSseFetch({ reads: [{ value: sseFrame({ ok: true }) }, { done: true }] });
    const fetchImpl = vi.fn((url: string, init?: { signal?: AbortSignal }) => {
      if (++call === 1) return makeFakeSseFetch({ reads: [{ neverResolves: true }] })(url, init);
      return second(url, init);
    });
    const onEvent = vi.fn();

    vi.useFakeTimers();
    const promise = postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any });
    await vi.advanceTimersByTimeAsync(HTTP_STREAM_FIRST_BYTE_TIMEOUT_MS + 2000);
    await promise;

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenCalledWith({ ok: true });
  });

  it("rejects immediately without calling fetch when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = makeFakeSseFetch({ reads: [{ done: true }] });
    const onEvent = vi.fn();

    await expect(
      postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any, signal: controller.signal })
    ).rejects.toThrow("Anfrage abgebrochen.");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("aborts an in-flight stream immediately when the caller's signal fires, without retrying", async () => {
    const controller = new AbortController();
    const fetchImpl = makeFakeSseFetch({ reads: [{ value: sseFrame({ a: 1 }) }, { neverResolves: true }] });
    const onEvent = vi.fn();

    const promise = postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any, signal: controller.signal });
    await Promise.resolve();
    await Promise.resolve();
    controller.abort();

    await expect(promise).rejects.toThrow("Anfrage abgebrochen.");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("forwards onStatus during a pre-first-byte retry wait", async () => {
    let call = 0;
    const second = makeFakeSseFetch({ reads: [{ done: true }] });
    const fetchImpl = vi.fn((url: string, init?: { signal?: AbortSignal }) => {
      if (++call === 1) return makeFakeSseFetch({ status: 429, bodyText: "" })(url, init);
      return second(url, init);
    });
    const onStatus = vi.fn();

    vi.useFakeTimers();
    const promise = postSseWithRetry(PARAMS, { onEvent: vi.fn(), fetchImpl: fetchImpl as any, onStatus, label: "Generierung" });
    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    expect(onStatus).toHaveBeenCalled();
    expect(onStatus.mock.calls[0][0]).toContain("Generierung fehlgeschlagen");
  });
});
