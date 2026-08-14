// Central home for internal, non-user-facing magic numbers.
//
// Retrieval scoring knobs that ARE meant to be user-tunable (similarity, rrfK,
// topK, outputDim, maxAgentRounds) stay in `RagChatSettings` (settings/types.ts)
// - only the internal constants below live here.

/**
 * Cap on how many candidate hits are pulled from each Orama leg (text/vector)
 * before RRF fusion. High enough to not clip real recall on this corpus size,
 * low enough to keep the fusion step cheap. See retrieval/hybrid-search.ts.
 */
export const CANDIDATE_POOL_LIMIT = 5000;

/**
 * How many hits to request from the fuzzy (vault-search) leg before merging
 * it into the fused hybrid results. Matches the general pool sizing used for
 * the other legs; the fuzzy leg is typically much smaller/precise already.
 * Used by both workflow.ts (baseline retrieval) and agent/execute-tool.ts
 * (search_manual_fuzzy tool).
 */
export const FUZZY_LEG_RESULT_LIMIT = 10;

/**
 * Synthetic rank offset applied to fuzzy-leg hits before folding them into
 * the shared `rrfMerge` reciprocal-rank fusion (see retrieval/rrf.ts). Fuzzy
 * hits don't have a native score comparable to BM25/vector scores, so they're
 * assigned ranks 0..n-1 (in the order returned by the fuzzy search API, which
 * is itself rank-ordered) offset by this constant. A small offset lets a
 * fuzzy-only top hit still land competitively in the fused ranking without
 * automatically outranking every text/vector hit.
 */
export const FUZZY_RANK_OFFSET = 0;

/** Maximum number of attempts (including the first) for retryable HTTP requests. */
export const HTTP_MAX_ATTEMPTS = 5;

/** Base delay for exponential backoff between retryable HTTP requests, in ms. */
export const HTTP_RETRY_BASE_DELAY_MS = 1000;

/** Upper bound on the (unjittered) backoff delay between retries, in ms. */
export const HTTP_RETRY_MAX_DELAY_MS = 16_000;

/** Multiplier applied to the base delay on each successive retry attempt. */
export const HTTP_RETRY_BACKOFF_FACTOR = 2;

/**
 * Maximum jitter (as a fraction of the computed backoff delay) added/removed
 * at random, to avoid thundering-herd retries against the Gemini API.
 */
export const HTTP_RETRY_JITTER_RATIO = 0.2;

/** How long to wait for a single HTTP request before aborting it, in ms. */
export const HTTP_REQUEST_TIMEOUT_MS = 30_000;

export const ABORT_ERROR_MESSAGE = "Anfrage abgebrochen.";
