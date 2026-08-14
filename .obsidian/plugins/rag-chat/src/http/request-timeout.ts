import { requestUrl, type RequestUrlParam, type RequestUrlResponse } from "obsidian";
import { ABORT_ERROR_MESSAGE, HTTP_REQUEST_TIMEOUT_MS } from "../constants";

export function requestWithTimeout(
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
        reject(new Error(`Zeitüberschreitung nach ${HTTP_REQUEST_TIMEOUT_MS / 1000}s`)),
      );
    }, HTTP_REQUEST_TIMEOUT_MS);
    signal?.addEventListener("abort", onAbort, { once: true });
    requestUrl({ ...params, throw: false }).then(
      (response) => finish(() => resolve(response)),
      (err) => finish(() => reject(err)),
    );
  });
}
