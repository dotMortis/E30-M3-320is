import { requestUrl, type RequestUrlParam, type RequestUrlResponse } from "obsidian";

export const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 4000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractErrorMessage(response: RequestUrlResponse): string | undefined {
  try {
    const jsonMsg = response.json?.error?.message;
    if (typeof jsonMsg === "string" && jsonMsg.trim()) return jsonMsg.trim();
  } catch {}
  const text = response.text?.trim();
  return text ? text.slice(0, 300) : undefined;
}

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

  throw new Error(`Request failed, status ${lastResponse?.status ?? "unknown"}`);
}
