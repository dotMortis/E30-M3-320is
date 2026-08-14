export function linkAbort(target: AbortController, source?: AbortSignal): () => void {
  if (!source) return () => {};
  if (source.aborted) {
    target.abort(source.reason);
    return () => {};
  }
  const handler = () => target.abort(source.reason);
  source.addEventListener("abort", handler, { once: true });
  return () => source.removeEventListener("abort", handler);
}
