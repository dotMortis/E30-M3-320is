import { ABORT_ERROR_MESSAGE, HTTP_MAX_ATTEMPTS } from "../constants";
import { computeDelayMs, RETRYABLE_STATUSES, sleep } from "./retry";
import { attemptPostSse, SseAttemptError, type PostSseOptions, type PostSseParams } from "./sse-attempt";

export type { PostSseOptions, PostSseParams } from "./sse-attempt";

export async function postSseWithRetry(params: PostSseParams, opts: PostSseOptions): Promise<void> {
  const label = opts.label ?? "Anfrage";

  for (let attempt = 1; attempt <= HTTP_MAX_ATTEMPTS; attempt++) {
    if (opts.signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);

    try {
      await attemptPostSse(params, opts);
      return;
    } catch (err) {
      if (opts.signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);

      const message = err instanceof Error ? err.message : String(err);
      if (!(err instanceof SseAttemptError)) {
        throw new Error(`${label} fehlgeschlagen: ${message}`);
      }

      const retryableStatus = typeof err.status === "number" && RETRYABLE_STATUSES.has(err.status);
      const retryable = !err.firstByteReceived && (retryableStatus || err.status === undefined);

      if (!retryable || attempt === HTTP_MAX_ATTEMPTS) {
        throw err.status !== undefined ? err : new Error(`${label} fehlgeschlagen: ${message}`);
      }

      const delay = computeDelayMs(attempt);
      await sleep(delay, opts.signal, (seconds) =>
        opts.onStatus?.(`${label} fehlgeschlagen (${message}) – erneuter Versuch in ${seconds}s (${attempt}/${HTTP_MAX_ATTEMPTS}) …`),
      );
      opts.onStatus?.(`${label} fehlgeschlagen (${message}) – erneuter Versuch (${attempt}/${HTTP_MAX_ATTEMPTS}) …`);
    }
  }
}
