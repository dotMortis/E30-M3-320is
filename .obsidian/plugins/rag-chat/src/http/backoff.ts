import {
  HTTP_RETRY_BACKOFF_FACTOR,
  HTTP_RETRY_BASE_DELAY_MS,
  HTTP_RETRY_JITTER_RATIO,
  HTTP_RETRY_MAX_DELAY_MS,
} from "../constants";

export const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export function computeDelayMs(attempt: number, retryAfterHeader?: string): number {
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
