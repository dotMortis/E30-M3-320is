import type { RequestUrlParam, RequestUrlResponse } from "obsidian";
import { ABORT_ERROR_MESSAGE, HTTP_MAX_ATTEMPTS } from "../constants";
import { computeDelayMs, RETRYABLE_STATUSES } from "./backoff";
import { extractResponseErrorMessage } from "./error-message";
import { requestWithTimeout } from "./request-timeout";
import { sleep } from "./sleep";

export { RETRYABLE_STATUSES } from "./backoff";
export { computeDelayMs } from "./backoff";
export { sleep } from "./sleep";

function retryAfterHeaderValue(response: RequestUrlResponse): string | undefined {
  const headers = response.headers ?? {};
  return headers["retry-after"] ?? headers["Retry-After"];
}

interface RetryOptions {
  onStatus?: (status: string) => void;
  label?: string;
  signal?: AbortSignal;
}

async function backoff(
  attempt: number,
  delay: number,
  signal: AbortSignal | undefined,
  onStatus: ((status: string) => void) | undefined,
  message: (suffix: string) => string,
): Promise<void> {
  await sleep(delay, signal, (seconds) =>
    onStatus?.(message(`in ${seconds}s (${attempt}/${HTTP_MAX_ATTEMPTS}) …`)),
  );
  onStatus?.(message(`(${attempt}/${HTTP_MAX_ATTEMPTS}) …`));
}

export async function requestUrlWithRetry(
  params: RequestUrlParam,
  opts?: RetryOptions,
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
      const message = err instanceof Error ? err.message : String(err);
      if (attempt === HTTP_MAX_ATTEMPTS) {
        throw new Error(`${label} fehlgeschlagen: ${message}`);
      }
      await backoff(attempt, computeDelayMs(attempt), signal, opts?.onStatus, (suffix) =>
        `${label} fehlgeschlagen (${message}) – erneuter Versuch ${suffix}`,
      );
      continue;
    }

    if (response.status < 400) return response;

    lastResponse = response;
    if (!RETRYABLE_STATUSES.has(response.status) || attempt === HTTP_MAX_ATTEMPTS) {
      const msg = extractResponseErrorMessage(response);
      throw new Error(`Request failed, status ${response.status}${msg ? `: ${msg}` : ""}`);
    }

    const delay = computeDelayMs(attempt, retryAfterHeaderValue(response));
    await backoff(attempt, delay, signal, opts?.onStatus, (suffix) =>
      `${label} überlastet (Status ${response.status}) – erneuter Versuch ${suffix}`,
    );
  }

  throw new Error(`Request failed, status ${lastResponse?.status ?? "unknown"}`);
}
