import { ABORT_ERROR_MESSAGE, HTTP_RETRY_COUNTDOWN_TICK_MS } from "../constants";

export function sleep(
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
