import { describe, expect, it, vi } from "vitest";
import { makeFakeSseFetch, sseFrame } from "../mocks/fetch-sse";
import {
  HTTP_MAX_ATTEMPTS,
  HTTP_STREAM_FIRST_BYTE_TIMEOUT_MS,
  HTTP_STREAM_IDLE_TIMEOUT_MS,
} from "../../constants";
import { PARAMS, postSseWithRetry } from "./stream-harness";

describe("postSseWithRetry (parsing & delivery)", () => {
  it("delivers parsed SSE events to onEvent in order and resolves when the stream ends", async () => {
    const fetchImpl = makeFakeSseFetch({
      reads: [{ value: sseFrame({ a: 1 }) + sseFrame({ a: 2 }) }, { done: true }],
    });
    const onEvent = vi.fn();

    await postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any });

    expect(onEvent).toHaveBeenNthCalledWith(1, { a: 1 });
    expect(onEvent).toHaveBeenNthCalledWith(2, { a: 2 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("parses CRLF-framed events (Gemini's real wire format), not just LF", async () => {

    const raw =
      'data: {"n":1}\r\n\r\n' +
      'data: {"n":2}\r\n\r\n';
    const fetchImpl = makeFakeSseFetch({ reads: [{ value: raw }, { done: true }] });
    const onEvent = vi.fn();

    await postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any });

    expect(onEvent).toHaveBeenNthCalledWith(1, { n: 1 });
    expect(onEvent).toHaveBeenNthCalledWith(2, { n: 2 });
  });

  it("flushes a final frame that arrives without a trailing separator", async () => {
    const fetchImpl = makeFakeSseFetch({ reads: [{ value: 'data: {"n":1}' }, { done: true }] });
    const onEvent = vi.fn();

    await postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any });

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({ n: 1 });
  });

  it("buffers a frame split across multiple chunks", async () => {
    const full = sseFrame({ text: "hallo welt" });
    const splitAt = Math.floor(full.length / 2);
    const fetchImpl = makeFakeSseFetch({
      reads: [{ value: full.slice(0, splitAt) }, { value: full.slice(splitAt) }, { done: true }],
    });
    const onEvent = vi.fn();

    await postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any });

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({ text: "hallo welt" });
  });

  it("skips a malformed JSON frame instead of crashing the whole stream", async () => {
    const fetchImpl = makeFakeSseFetch({
      reads: [{ value: "data: {not valid json\n\n" + sseFrame({ ok: true }) }, { done: true }],
    });
    const onEvent = vi.fn();

    await postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any });

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({ ok: true });
  });

  it("throws immediately on a non-retryable non-ok status without retrying", async () => {
    const fetchImpl = makeFakeSseFetch({ status: 400, bodyText: JSON.stringify({ error: { message: "bad request" } }) });
    const onEvent = vi.fn();

    await expect(postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any })).rejects.toThrow(
      "Request failed, status 400: bad request"
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries a retryable non-ok status pre-first-byte and succeeds on the next attempt", async () => {
    let call = 0;
    const first = makeFakeSseFetch({ status: 503, bodyText: "overloaded" });
    const second = makeFakeSseFetch({ reads: [{ value: sseFrame({ ok: true }) }, { done: true }] });
    const fetchImpl = vi.fn((url: string, init?: { signal?: AbortSignal }) => (++call === 1 ? first(url, init) : second(url, init)));
    const onEvent = vi.fn();

    vi.useFakeTimers();
    const promise = postSseWithRetry(PARAMS, { onEvent, fetchImpl: fetchImpl as any });
    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenCalledWith({ ok: true });
  });

});
