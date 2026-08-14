# rag-chat Refactor Plan

**Execution status: complete.** Phases 0-6 (items #2-#28; #1 descoped, see
below) plus the low-severity cleanup sweep have all been implemented, each
with regression tests, keeping `npm run typecheck` and `npm test` green
throughout. This document is kept as the historical record of the audit and
the decisions made; see git history for the actual change-by-change
implementation.

Consolidated audit findings and phased remediation plan for the rag-chat
Obsidian plugin. Findings came from a five-part audit (agent loop, retrieval
pipeline, Gemini/HTTP client, view/UI layer, settings/main/citations).

Scope of this plan: all HIGH and MEDIUM severity findings. LOW-severity items
are listed at the end as an optional cleanup sweep and are NOT part of the main
pass.

Sequencing principle: foundational fixes (security, data correctness) land
before UX/performance work that builds on top of them. Each phase is
independently shippable and testable. Every change must keep `npm run typecheck`
and `npm test` green; new behavior gets a regression test.

## Resolved decisions

- **#13 fuzzy fusion**: fold the fuzzy leg into the existing RRF model (give
  fuzzy hits a synthetic rank and reuse `rrfMerge`) — one fusion model, best
  results. Drop the separate hand-rolled weighted blend.
- **#15/#18 HTTP tuning**: keep timeout / max-attempts / base-delay as internal
  constants (not user-facing settings). Collect ALL magic constants into a
  single dedicated constants file (see Phase 0).
- **#1 key migration**: on upgrade, silently drop any old-format key blob and
  prompt the user to re-enter. No decrypt-with-old-scheme migration.
- **#1 descoped (execution-time finding)**: Electron's `safeStorage` is a
  main-process-only module. Obsidian plugins run in the renderer process;
  even with `nodeIntegration: true`, `require('electron')` there returns the
  renderer-side binding table, which does not expose `safeStorage` (nor
  `app`/`dialog`/etc). Reaching main-process-only APIs would require the
  deprecated `remote` module or `@electron/remote`, both of which need the
  *main* process to explicitly enable them per-`webContents` - something
  Obsidian's own main process does not do for plugin views. An open,
  unanswered Obsidian forum thread (from 2023, bumped again in 2024) confirms
  no known workaround exists. Given this, item #1 as originally specified is
  not implementable and was left out of the executed pass; the existing
  fingerprint+scrypt scheme in `secure-storage.ts` is unchanged. A real fix
  (e.g. a randomly-generated, non-guessable local master key persisted
  alongside the ciphertext in the plugin's own gitignored `data.json`,
  replacing the machine-fingerprint derivation) remains open for a future
  pass.

---

## Already done

- Removed `src/retrieval/followup.ts` + its test; `workflow.ts` now passes the
  raw question straight into baseline retrieval. (Brittle German-keyword /
  word-count heuristic; chat continuity is handled separately by
  `buildHistoryContents`, and the agent can self-correct via `search_manual`.)

---

## Phase 0 — Central constants file

Create `src/constants.ts` as the single home for the magic numbers currently
scattered across the codebase, each with a short comment explaining its origin/
rationale. Migrate existing named constants here and replace the inline literals.

Constants to centralize:

- `CANDIDATE_POOL_LIMIT` (`retrieval/hybrid-search.ts:7`)
- Fuzzy-leg result limit `10` (duplicated in `workflow.ts:53`,
  `agent/execute-tool.ts:26`)
- HTTP `MAX_ATTEMPTS`, `RETRY_DELAY_MS` (base), backoff/jitter params, request
  timeout (`http/retry.ts:3,5,6` + new)
- Any RRF-related fuzzy synthetic-rank constant introduced by Phase 3 #13
- Existing hard caps referenced by the agent loop where sensible

Note: the retrieval scoring knobs that ARE meant to be user-tunable
(`similarity`, `rrfK`, `topK`, `outputDim`, `maxAgentRounds`) stay in
`RagChatSettings` — only the internal, non-user-facing constants move here.

---

## Phase 1 — Security-critical

1. **Real key storage** — `secure-storage.ts:20-33`
   Replace machine-fingerprint + scrypt key derivation (guessable `os.hostname/
   platform/arch/cpus/totalmem/homedir`) with Electron `safeStorage`
   (`encryptString`/`decryptString`, OS-keychain backed). Keep a versioned
   prefix (`enc:v2:` for safeStorage). On startup, detect any old-format
   (`enc:v1:` / fingerprint) blob and **silently drop it**, then prompt re-entry
   via the existing "clear field + Notice" path. No old-scheme decrypt attempt.
   Tests: round-trip via mocked `safeStorage`; legacy/tampered blob → graceful clear.

2. **Citation HTML injection** — `citations/page-citations.ts:24,30`,
   `citations/reference-citations.ts:20`
   HTML-escape the unmatched ("unverified") fallback text before interpolating
   into `title="..."` / `<summary>...`. Model-generated text derived from
   retrieved manual/web content must not be able to inject markup.
   Tests: a citation code containing `"><img onerror=...>` renders escaped.

3. **Context XML escaping** — `retrieval/context-xml.ts:3-9` (and the
   `<question>` interpolation at `agent/loop.ts:101`)
   Escape `&`, `<`, `>`, `"` in `notePath`/`seitencode`/`sektion`/`titel` and in
   `fullText`, so a note containing `</document>` or stray `<`/`>` can't corrupt
   document-boundary attribution in the prompt.
   Tests: note text with literal `</document>` and `<`/`>` comparisons.

4. **Mask API key input** — `settings/settings-tab.ts:24-32`
   Set `text.inputEl.type = "password"` with a reveal toggle.

---

## Phase 2 — Agent loop correctness

5. **Tool exception handling** — `agent/loop.ts:51`, `agent/execute-tool.ts`
   Wrap each `executeTool` call in try/catch; on throw, return a graceful
   `{ error: "..." }` tool response so the model can recover, instead of
   crashing the turn and losing accumulated citations/progress. Aligns with the
   existing `{error}` returns for empty-query/missing-note cases.
   Tests: a throwing tool yields an error functionResponse, loop continues.

6. **`ask_user` batched with other calls** — `agent/loop.ts:40-46`
   When a round contains `ask_user` alongside other function calls, execute the
   other calls and emit their `functionResponse`s before pausing (or explicitly
   decide + document a policy), so history never contains a `functionCall` with
   no matching `functionResponse`.
   Tests: round with `search_manual` + `ask_user` produces a valid resume state.

7. **Cancel/abandon pending clarification** — `view/controller.ts:53,73-76`,
   `agent/loop.ts:110-113`
   Add an affordance to abandon a pending `ask_user` so an unrelated new message
   isn't blindly submitted as "the answer." Ties into Phase 5 (#23) and the
   clear-chat gap.
   Tests: abandoning pending state routes the next message to a fresh
   `answerQuestion`.

8. **Validate `get_manual_page` required args** —
   `agent/tool-declarations.ts:46`, `agent/execute-tool.ts:34-40`
   Reject/skip blank `seitencode`/`sektion`/`titel` instead of blank-defaulting
   them and overwriting a good baseline `ContextBlock` with empty metadata.

9. **Snapshot settings into `PendingAgentState`** — `agent/types.ts:21-24`,
   `agent/loop.ts:45,108-109`, `view/view.ts:106`
   Capture a settings snapshot (or re-read fresh) rather than holding a live
   mutable reference that changes mid-clarification.

10. **Single source of truth for tool descriptions** —
    `agent/tool-declarations.ts` vs `gemini/prompts.ts:31-47`
    Derive the prompt's `TOOL_DESCRIPTIONS` from `FUNCTION_DECLARATIONS` (or vice
    versa) so the two can't drift.

---

## Phase 3 — Retrieval pipeline correctness

11. **fuzzy-merge dedup bug** — `retrieval/fuzzy-merge.ts:11-14`
    Keep the best-scoring chunk per `notePath` (max), not the last one iterated.
    Tests: two hybrid hits sharing a `notePath` keep the higher score.
    (Note: superseded/absorbed by #13's RRF unification, but the correctness
    invariant must be preserved by the new implementation and covered by a test.)

12. **Index/manifest cache invalidation + reload race** —
    `retrieval/index-cache.ts:5-22`, `main.ts:16,68-72`
    - Use `manifest.corpusHash` (currently never read) to invalidate the cached
      indices when the corpus changes.
    - Cache the in-flight `Promise<CachedIndices>` (not just the resolved value)
      to eliminate the concurrent double-load race.
    - Add a manual "Reload RAG index" command that clears both the index cache
      and `manifestCache`.
    Tests: changed corpusHash forces reload; concurrent calls load once.

13. **Unify fuzzy leg into RRF (chosen approach)** —
    `retrieval/fuzzy-merge.ts`, `retrieval/rrf.ts`, `retrieval/hybrid-search.ts`,
    `workflow.ts`
    Replace the hand-rolled linear-decay + fixed 0.7/0.3 weighted blend with a
    single fusion model: assign fuzzy hits a synthetic rank and merge them
    through the same `rrfMerge` used for the text and vector legs (tunable via
    the existing `rrfK` setting). Remove `HYBRID_LEG_WEIGHT`/`FUZZY_LEG_WEIGHT`.
    Any residual constant (e.g. a fuzzy rank offset) goes in `constants.ts`.
    Tests: fuzzy hits participate in RRF; ordering matches expected reciprocal-
    rank math; same-notePath dedup keeps the best (covers #11).

14. **Re-validate manifest on relevant settings change** — `main.ts:46-55`,
    `settings/settings-tab.ts:53-64`, `retrieval/embeddings.ts:7-20`
    Re-run `validateManifest()` (via cached manifest) from the `outputDim` /
    `embeddingModel` `onChange` handlers and surface a `Notice`, instead of only
    warning once at `onload()` while the value applies live.

---

## Phase 4 — HTTP / Gemini client robustness

(All tuning values below live in `src/constants.ts`, not settings — see Phase 0.)

15. **Request timeout** — `http/retry.ts`, `gemini/client.ts:38`
    Add a timeout (via `Promise.race`/`AbortController`) so a hung request fails
    instead of waiting forever.

16. **Retry network-level rejections** — `http/retry.ts:29`
    Wrap `requestUrl` in try/catch and treat thrown/rejected errors as retryable
    up to `MAX_ATTEMPTS`.
    Tests: a rejecting `requestUrl` is retried.

17. **Guard `response.json`** — `gemini/client.ts:48`
    `response.json` is a throwing getter; wrap access in try/catch and surface a
    clean error on non-JSON 200 bodies.
    Tests: 200 with invalid-JSON body → clean Error.

18. **Backoff + jitter + 429 handling** — `http/retry.ts:3,5,6`
    Exponential backoff with jitter; read `Retry-After` when present; treat 429
    distinctly from 5xx.
    Tests: delay grows across attempts; `Retry-After` respected.

19. **Safety-block handling** — `gemini/client.ts:48-52`
    Detect `promptFeedback.blockReason` / `finishReason` (SAFETY, RECITATION,
    MAX_TOKENS) and surface an actionable error instead of a generic
    shape-mismatch throw.

20. **Function-call `id` correlation** — `gemini/types.ts:3-4`, `agent/loop.ts:53`
    Add `id` to `functionCall`/`functionResponse` types and echo the returned
    `id` back on the response, required when `google_search` + custom tools are
    combined in one turn (which the client already opts into via
    `includeServerSideToolInvocations`).

---

## Phase 5 — View / UI layer

21. **Incremental turn rendering** — `view/render-turns.ts:16`,
    `view/view.ts:73-75,112,122`
    Stop `.empty()`-ing and rebuilding all turns (+ re-running Markdown render)
    on every message. Append only the new/changed turn; keep a
    `Map<ChatTurn, HTMLElement>`. Fixes O(n²) growth and the "expanded
    `<details>` collapses each message" side effect. Ensure per-render
    `MarkdownRenderer` components are properly scoped/unloaded.

22. **Request cancellation + teardown** — `view/view.ts:63-65`, thread through
    `sendMessage`/`answerQuestion`/`continueAnswer`; `main.ts:58`
    Add an `AbortSignal`; abort in `onClose()`; reset `busy` and avoid
    `Notice`/rerender on a closed view. Implement `onunload()` leaf detach.

23. **Reentrancy guard in the controller** — `view/controller.ts:52-99`
    Guard `sendMessage` against concurrent invocation on the same
    `ChatSessionState`, not only via the UI `busy` flag.

24. **Scroll behavior** — `view/render-turns.ts:54`, `view/view.ts:86`
    Only auto-scroll when the user is already near the bottom; don't yank on
    every status tick.

25. **`registerDomEvent`** — `view/view.ts:50,58`, `view/wire-links.ts:6,11`,
    `view/render-citations.ts:15`
    Replace raw `addEventListener` with Obsidian's lifecycle-scoped helper.

26. **Unify citation rendering + fix reference collisions** —
    `citations/page-citations.ts:4-35`, `citations/reference-citations.ts:4-24`
    Extract a shared `renderCitationBracket(...)` helper; give reference
    citations the same multi-match disambiguation UI that page citations have
    (instead of silently picking `matches[0]`). Add a combined-pipeline test
    (web + manual + reference on one line) to cover ordering interactions.

27. **"Clear chat" / new conversation command**
    Add an explicit command + UI affordance to reset `ChatSessionState`
    (turns + pendingAgentState). Closes the long-standing "history grows forever
    in a long-lived leaf" gap; complements #21/#22.

---

## Phase 6 — Settings / misc

28. **Avoid needless re-encryption** — `main.ts:112-118`,
    `settings/settings-tab.ts`
    Only re-encrypt the secret when it actually changed (diff against previous),
    and/or debounce text `onChange`. Avoids a full crypto round-trip on every
    keystroke / unrelated settings change. (Largely moot if #1 switches to
    `safeStorage`, but the "encrypt on every unrelated save" pattern should
    still be fixed.)

---

## Low severity — optional cleanup sweep (not in main pass)

- Dead `VECTOR_SCHEMA` / `EMBEDDING_DIMS` / `RagVectorDocument`
  (`orama-schema.ts`) — either wire up vector-shard schema validation on load or
  delete.
- Split `plugin/manifest.ts` into `plugin/paths.ts` + move `readManifest` next
  to `RagManifest` (naming overlaps with Obsidian's `PluginManifest` and the
  top-level `manifest.json`).
- `compact-hits.ts` — trivially small; consider inlining / sharing a generic
  compact mapper with the fuzzy path.
- `ENCRYPTED_FIELDS` array-of-one over-abstraction (`main.ts:10-12`).
- `history.ts:9` trims for the emptiness check but emits untrimmed text;
  consecutive same-role turns possible after filtering middle empties.
- Non-idempotent LLM retries (inherent; document only).
- `GERMAN_STOPWORDS` provenance comment; `escapeWikilinkPath` only escapes `|`
  not `]]`; case/whitespace-sensitive citation matching.
- Assorted test-coverage gaps noted per-module in the audit.

---

## Working agreement

- One phase (or one numbered item) at a time, each as a reviewable change.
- `npm run typecheck` + `npm test` must stay green after every item.
- New behavior gets a regression test; bug fixes get a test that fails before
  the fix.
- `main.js` bundle rebuild (`npm run build`) is done on request, not
  automatically.
