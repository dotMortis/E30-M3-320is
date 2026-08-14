import {
  requestUrl,
  type RequestUrlParam,
  type RequestUrlResponse,
} from "obsidian";
import {
  ABORT_ERROR_MESSAGE,
  HTTP_MAX_ATTEMPTS,
  HTTP_REQUEST_TIMEOUT_MS,
  HTTP_RETRY_BACKOFF_FACTOR,
  HTTP_RETRY_BASE_DELAY_MS,
  HTTP_RETRY_COUNTDOWN_TICK_MS,
  HTTP_RETRY_JITTER_RATIO,
  HTTP_RETRY_MAX_DELAY_MS,
} from "../constants";

export const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

/**
 * Waits `ms` milliseconds. When `onTick` is provided, calls it immediately
 * and then every `HTTP_RETRY_COUNTDOWN_TICK_MS` with the actual remaining
 * time (ceiling-rounded to whole seconds, never below 1 while still
 * waiting) so a caller-displayed "erneuter Versuch in Ns" counts down live
 * instead of staying frozen at the initial estimate for the whole delay.
 */
function sleep(
  ms: number,
  signal?: AbortSignal,
  onTick?: (remainingSeconds: number) => void,
): Promise<void> {
  if (signal?.aborted) return Promise.reject(new Error(ABORT_ERROR_MESSAGE));
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const emitTick = () => {
      const remainingMs = ms - (Date.now() - start);
      if (remainingMs > 0) onTick?.(Math.ceil(remainingMs / 1000));
    };
    emitTick();
    const interval = onTick
      ? setInterval(emitTick, HTTP_RETRY_COUNTDOWN_TICK_MS)
      : undefined;
    const onAbort = () => {
      if (interval) clearInterval(interval);
      clearTimeout(timer);
      reject(new Error(ABORT_ERROR_MESSAGE));
    };
    const timer = setTimeout(() => {
      if (interval) clearInterval(interval);
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function extractErrorMessage(response: RequestUrlResponse): string | undefined {
  try {
    const jsonMsg = response.json?.error?.message;
    if (typeof jsonMsg === "string" && jsonMsg.trim()) return jsonMsg.trim();
  } catch {}
  const text = response.text?.trim();
  return text ? text.slice(0, 300) : undefined;
}

/**
 * Obsidian's `requestUrl` has no built-in timeout or AbortSignal support, so
 * a hung request would otherwise wait forever. We race it against a timer
 * instead - the underlying request may keep running in the background, but
 * our caller stops waiting and can retry/fail instead of hanging.
 */
function requestWithTimeout(
  params: RequestUrlParam,
  signal?: AbortSignal,
): Promise<RequestUrlResponse> {
  if (signal?.aborted) return Promise.reject(new Error(ABORT_ERROR_MESSAGE));
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      fn();
    };
    const onAbort = () => finish(() => reject(new Error(ABORT_ERROR_MESSAGE)));
    const timer = setTimeout(() => {
      finish(() =>
        reject(
          new Error(
            `Zeitüberschreitung nach ${HTTP_REQUEST_TIMEOUT_MS / 1000}s`,
          ),
        ),
      );
    }, HTTP_REQUEST_TIMEOUT_MS);
    signal?.addEventListener("abort", onAbort, { once: true });
    requestUrl({ ...params, throw: false }).then(
      (response) => finish(() => resolve(response)),
      (err) => finish(() => reject(err)),
    );
  });
}

/**
 * Exponential backoff with jitter for attempt N (1-based): base * factor^(N-1),
 * capped, then jittered by +/- HTTP_RETRY_JITTER_RATIO to avoid a thundering
 * herd of retries against the API. When a `Retry-After` header is present
 * (seconds or an HTTP-date), it takes precedence over the computed backoff.
 */
function computeDelayMs(attempt: number, retryAfterHeader?: string): number {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1000);
    const dateMs = Date.parse(retryAfterHeader);
    if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
  }
  const exponential =
    HTTP_RETRY_BASE_DELAY_MS * HTTP_RETRY_BACKOFF_FACTOR ** (attempt - 1);
  const capped = Math.min(exponential, HTTP_RETRY_MAX_DELAY_MS);
  const jitter = (Math.random() * 2 - 1) * capped * HTTP_RETRY_JITTER_RATIO;
  return Math.max(0, Math.round(capped + jitter));
}

function retryAfterHeaderValue(
  response: RequestUrlResponse,
): string | undefined {
  const headers = response.headers ?? {};
  return headers["retry-after"] ?? headers["Retry-After"];
}

/**
 * Note: retries here are not guaranteed idempotent. If a request actually
 * succeeded server-side (e.g. Gemini generated/billed a response) but the
 * client never saw it (our own timeout, a dropped connection, ...), the
 * retried attempt is a genuinely new call - there's no request-id/idempotency
 * key in play. This is an inherent tradeoff of retrying non-idempotent LLM
 * generation calls, not something fixed by tuning backoff - documented here,
 * not solved.
 */
export async function requestUrlWithRetry(
  params: RequestUrlParam,
  opts?: {
    onStatus?: (status: string) => void;
    label?: string;
    signal?: AbortSignal;
  },
): Promise<RequestUrlResponse> {
  const label = opts?.label ?? "Anfrage";
  const signal = opts?.signal;
  let lastResponse: RequestUrlResponse | undefined;

  for (let attempt = 1; attempt <= HTTP_MAX_ATTEMPTS; attempt++) {
    if (signal?.aborted) throw new Error(ABORT_ERROR_MESSAGE);

    let response: RequestUrlResponse;
    try {
      response = await requestWithTimeout(params, signal);
    } catch (err) {
      if (signal?.aborted) throw err;
      // Network-level failures (DNS, connection reset, our own timeout,
      // ...) reject the promise entirely rather than resolving with a 4xx/5xx
      // status - retry those too, up to HTTP_MAX_ATTEMPTS.
      const message = err instanceof Error ? err.message : String(err);
      if (attempt === HTTP_MAX_ATTEMPTS) {
        throw new Error(`${label} fehlgeschlagen: ${message}`);
      }
      const delay = computeDelayMs(attempt);
      await sleep(delay, signal, (seconds) =>
        opts?.onStatus?.(
          `${label} fehlgeschlagen (${message}) – erneuter Versuch in ${seconds}s (${attempt}/${HTTP_MAX_ATTEMPTS}) …`,
        ),
      );
      opts?.onStatus?.(
        `${label} fehlgeschlagen (${message}) – erneuter Versuch (${attempt}/${HTTP_MAX_ATTEMPTS}) …`,
      );
      continue;
    }

    if (response.status < 400) return response;

    lastResponse = response;
    const retryable = RETRYABLE_STATUSES.has(response.status);
    if (!retryable || attempt === HTTP_MAX_ATTEMPTS) {
      const msg = extractErrorMessage(response);
      throw new Error(
        `Request failed, status ${response.status}${msg ? `: ${msg}` : ""}`,
      );
    }

    const delay = computeDelayMs(attempt, retryAfterHeaderValue(response));
    await sleep(delay, signal, (seconds) =>
      opts?.onStatus?.(
        `${label} überlastet (Status ${response.status}) – erneuter Versuch in ${seconds}s (${attempt}/${HTTP_MAX_ATTEMPTS}) …`,
      ),
    );
    opts?.onStatus?.(
      `${label} überlastet (Status ${response.status}) – erneuter Versuch (${attempt}/${HTTP_MAX_ATTEMPTS}) …`,
    );
  }

  throw new Error(
    `Request failed, status ${lastResponse?.status ?? "unknown"}`,
  );
}
