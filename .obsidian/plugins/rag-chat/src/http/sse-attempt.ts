import {
  ABORT_ERROR_MESSAGE,
  HTTP_STREAM_FIRST_BYTE_TIMEOUT_MS,
  HTTP_STREAM_IDLE_TIMEOUT_MS,
} from "../constants";
import { linkAbort } from "./abort";
import { extractErrorMessageFromText } from "./error-message";
import { extractSseEvents } from "./sse-parse";

export interface PostSseParams {
  url: string;
  headers: Record<string, string>;
  body: string;
}

export interface PostSseOptions {
  onEvent: (data: unknown) => void;
  onStatus?: (status: string) => void;
  label?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export class SseAttemptError extends Error {
  constructor(
    message: string,
    readonly firstByteReceived: boolean,
    readonly status?: number,
  ) {
    super(message);
  }
}

export async function attemptPostSse(params: PostSseParams, opts: PostSseOptions): Promise<void> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const attemptController = new AbortController();
  const unlinkCaller = linkAbort(attemptController, opts.signal);

  let firstByteReceived = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const armTimer = (ms: number, reason: string) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => attemptController.abort(new Error(reason)), ms);
  };
  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  const fail = (message: string, status?: number): never => {
    throw new SseAttemptError(message, firstByteReceived, status);
  };

  try {
    armTimer(
      HTTP_STREAM_FIRST_BYTE_TIMEOUT_MS,
      `Zeitüberschreitung nach ${HTTP_STREAM_FIRST_BYTE_TIMEOUT_MS / 1000}s (kein Streaming-Start)`,
    );

    let response: Response;
    try {
      response = await fetchImpl(params.url, {
        method: "POST",
        headers: params.headers,
        body: params.body,
        signal: attemptController.signal,
      });
    } catch (err) {
      if (opts.signal?.aborted) throw fail(ABORT_ERROR_MESSAGE);
      throw fail(err instanceof Error ? err.message : String(err));
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const msg = extractErrorMessageFromText(text);
      throw fail(`Request failed, status ${response.status}${msg ? `: ${msg}` : ""}`, response.status);
    }

    if (!response.body) {
      throw fail("Streaming-Antwort enthält keinen lesbaren Body.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        let result: ReadableStreamReadResult<Uint8Array>;
        try {
          result = await reader.read();
        } catch (err) {
          if (opts.signal?.aborted) throw fail(ABORT_ERROR_MESSAGE);
          throw fail(err instanceof Error ? err.message : String(err));
        }
        if (result.done) break;

        firstByteReceived = true;
        armTimer(
          HTTP_STREAM_IDLE_TIMEOUT_MS,
          `Streaming-Verbindung gestoppt (keine Daten seit ${HTTP_STREAM_IDLE_TIMEOUT_MS / 1000}s).`,
        );

        buffer += decoder.decode(result.value, { stream: true });
        const { events, rest } = extractSseEvents(buffer);
        buffer = rest;
        for (const event of events) opts.onEvent(event);
      }

      const { events } = extractSseEvents(buffer + "\n\n");
      for (const event of events) opts.onEvent(event);
    } finally {
      reader.releaseLock();
    }
  } finally {
    clearTimer();
    unlinkCaller();
  }
}
