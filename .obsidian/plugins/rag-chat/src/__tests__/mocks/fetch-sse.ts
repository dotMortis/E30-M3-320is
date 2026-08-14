import { vi } from "vitest";

export interface QueuedRead {

  value?: string;

  done?: boolean;

  delayMs?: number;

  neverResolves?: boolean;
}

export interface FakeSseFetchOptions {

  status?: number;

  ok?: boolean;

  bodyText?: string;

  reads?: QueuedRead[];

  rejectWith?: Error;
}

function abortError(signal: AbortSignal | undefined): Error {
  const reason = signal?.reason;
  return reason instanceof Error ? reason : new Error("aborted");
}

export function makeFakeSseFetch(opts: FakeSseFetchOptions) {
  return vi.fn(async (_url: string, init?: { signal?: AbortSignal }) => {
    const signal = init?.signal;
    if (opts.rejectWith) throw opts.rejectWith;
    if (signal?.aborted) throw abortError(signal);

    const status = opts.status ?? 200;
    const ok = opts.ok ?? status < 400;

    if (!ok) {
      return {
        ok,
        status,
        text: async () => opts.bodyText ?? "",
        body: null,
      };
    }

    const queue = [...(opts.reads ?? [])];
    const reader = {
      read: async () => {
        if (signal?.aborted) throw abortError(signal);
        const next = queue.shift();
        if (!next) return { done: true, value: undefined };

        if (next.neverResolves) {
          return await new Promise<never>((_resolve, reject) => {
            signal?.addEventListener("abort", () => reject(abortError(signal)), { once: true });
          });
        }
        if (next.delayMs) {
          await new Promise<void>((resolve, reject) => {
            const t = setTimeout(resolve, next.delayMs);
            signal?.addEventListener(
              "abort",
              () => {
                clearTimeout(t);
                reject(abortError(signal));
              },
              { once: true }
            );
          });
        }
        if (signal?.aborted) throw abortError(signal);
        if (next.done) return { done: true, value: undefined };
        return { done: false, value: new TextEncoder().encode(next.value ?? "") };
      },
      releaseLock: () => {},
    };

    return {
      ok: true,
      status,
      text: async () => "",
      body: { getReader: () => reader },
    };
  });
}

export function sseFrame(data: unknown): string {
  return `data: ${JSON.stringify(data)}\r\n\r\n`;
}

export const fetchMock = vi.fn();

export function resetFetchMock(): void {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
}

export function mockGenerationSequence(responses: { json: unknown }[]): void {
  for (const response of responses) {
    fetchMock.mockImplementationOnce(async () => {
      let consumed = false;
      return {
        ok: true,
        status: 200,
        text: async () => "",
        body: {
          getReader: () => ({
            read: async () => {
              if (consumed) return { done: true, value: undefined };
              consumed = true;
              return { done: false, value: new TextEncoder().encode(sseFrame(response.json)) };
            },
            releaseLock: () => {},
          }),
        },
      };
    });
  }
}
