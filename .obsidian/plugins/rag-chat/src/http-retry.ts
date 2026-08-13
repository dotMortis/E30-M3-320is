import { requestUrl, type RequestUrlParam, type RequestUrlResponse } from "obsidian";

/**
 * http-retry.ts — shared resilience wrapper for the plugin's two live network
 * calls (embedQuery's embedContent in retriever.ts, generateWithTools's
 * generateContent in gemini.ts). Google's Gemini backend (especially preview
 * models like gemini-3.6-flash) occasionally returns a transient 429/5xx
 * under load - previously BOTH call sites used Obsidian's requestUrl
 * directly with its default throw-on-4xx/5xx behavior, so a single transient
 * blip immediately killed the whole chat turn with a bare
 * "Fehler: Request failed, status 503" and no retry at all. The Python
 * indexer (.pipeline/rag/embed_gemini.py's embed_with_retry) already solved
 * this for build-time embedding calls; this ports the same idea to the
 * shipped plugin's query-time calls.
 *
 * Uses requestUrl's `{ throw: false }` option to get the response object
 * (with a real `.status`) back even on 4xx/5xx, instead of parsing a thrown
 * Error's message string to decide whether to retry.
 */

/** Transient/server-load codes worth retrying. Anything else (400 bad
 * request, 401/403 auth, 404 model not found, etc.) is NOT retried - retrying
 * a structurally-wrong request just wastes the full backoff window before
 * failing anyway. */
export const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 4000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Best-effort extraction of a human-readable error message from a failed
 * response, so thrown errors are more useful than a bare status code (e.g.
 * "Request failed, status 503: The model is overloaded. Please try again
 * later." instead of just "Request failed, status 503"). Falls back to a
 * text snippet, then to nothing, rather than throwing while building an
 * error message. */
function extractErrorMessage(response: RequestUrlResponse): string | undefined {
  try {
    const jsonMsg = response.json?.error?.message;
    if (typeof jsonMsg === "string" && jsonMsg.trim()) return jsonMsg.trim();
  } catch {
    // response.json can throw if the body isn't valid JSON - fall through to text.
  }
  const text = response.text?.trim();
  return text ? text.slice(0, 300) : undefined;
}

/**
 * requestUrl wrapper with retry-with-fixed-backoff on transient errors.
 * Up to MAX_ATTEMPTS (3) total tries, waiting RETRY_DELAY_MS (4s) between
 * each retry - not exponential, since this is an interactive chat waiting on
 * a live UI, not a batch job (contrast with embed_gemini.py's exponential
 * backoff, which is fine for an unattended build). `opts.onStatus`, if
 * given, is called once per retry with a live progress label (mirrors
 * agent.ts's onStatus pattern) so the UI can show *why* it's still waiting
 * instead of looking stuck.
 */
export async function requestUrlWithRetry(
  params: RequestUrlParam,
  opts?: { onStatus?: (status: string) => void; label?: string }
): Promise<RequestUrlResponse> {
  const label = opts?.label ?? "Anfrage";
  let lastResponse: RequestUrlResponse | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await requestUrl({ ...params, throw: false });
    if (response.status < 400) return response;

    lastResponse = response;
    const retryable = RETRYABLE_STATUSES.has(response.status);
    if (!retryable || attempt === MAX_ATTEMPTS) {
      const msg = extractErrorMessage(response);
      throw new Error(`Request failed, status ${response.status}${msg ? `: ${msg}` : ""}`);
    }

    opts?.onStatus?.(
      `${label} überlastet (Status ${response.status}) – erneuter Versuch in ${RETRY_DELAY_MS / 1000}s (${attempt}/${MAX_ATTEMPTS}) …`
    );
    await sleep(RETRY_DELAY_MS);
  }

  // Unreachable (the loop always either returns or throws above) - satisfies
  // TypeScript's control-flow analysis without an `as never` cast.
  throw new Error(`Request failed, status ${lastResponse?.status ?? "unknown"}`);
}
