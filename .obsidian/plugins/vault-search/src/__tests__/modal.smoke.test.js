/**
 * modal.smoke.test.js — smoke test for VaultSearchModal's query-handling
 * loop (see ../main.js), using a hand-rolled `obsidian` mock (see
 * ./mocks/obsidian.js) instead of the real package + jsdom.
 *
 * UPDATED for optimization #1 (debounce + stale-search cancellation) - see
 * the optimization plan. Originally (pre-#1) this file pinned down that
 * every `input` event triggered an IMMEDIATE `engine.search()` call with
 * no debounce; that behaviour has now been intentionally changed (rapid
 * keystrokes within QUERY_DEBOUNCE_MS collapse into a single search) as
 * one of the agreed performance optimizations, so the first test below now
 * asserts the NEW coalescing behaviour instead of the old one-call-per-
 * keystroke behaviour.
 *
 * Two things are pinned down here:
 *
 *  1. NEW: a burst of rapid keystrokes within the debounce window
 *     collapses into exactly one `engine.search()` call, not one per
 *     keystroke.
 *  2. UNCHANGED invariant: the stale-query guard (`_queryToken`,
 *     main.js:232-234-ish) still ensures that if an OLDER query's search
 *     resolves AFTER a NEWER query's search, only the newer query's
 *     results ever get rendered. This must NOT change - it's the
 *     correctness property the cancellation optimization builds on top of
 *     (stopping stale work early is a performance improvement, not a
 *     correctness fix).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { makeEl } from "./mocks/obsidian.js";

vi.mock("obsidian", async () => {
  const mock = await import("./mocks/obsidian.js");
  return mock;
});

// main.js calls `window.setTimeout`/`window.clearTimeout` - Node's "node"
// test environment has no global `window`, so alias it to globalThis
// (which already has real setTimeout/clearTimeout) before main.js runs.
beforeAll(() => {
  if (typeof globalThis.window === "undefined") {
    globalThis.window = globalThis;
  }
});

let VaultSearchModal;
beforeAll(async () => {
  ({ VaultSearchModal } = await import("../main.js"));
});

function makeFakeApp() {
  return {
    workspace: { getLeaf: () => ({ openFile: vi.fn() }) },
    vault: { getFileByPath: () => null, cachedRead: async () => "" },
  };
}

function makeFakePlugin(app, searchImpl) {
  return {
    app,
    engine: {
      ready: true,
      search: vi.fn(searchImpl),
    },
  };
}

describe("VaultSearchModal query handling", () => {
  let app;

  beforeEach(() => {
    app = makeFakeApp();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("collapses a burst of rapid keystrokes into a single debounced search", async () => {
    vi.useFakeTimers();
    const plugin = makeFakePlugin(app, async () => ({ results: [], correction: null, expandedTerms: [] }));
    const modal = new VaultSearchModal(app, plugin);
    modal.open();
    // opening itself triggers one initial, non-debounced _onQueryChanged()
    // (see main.js's onOpen(): only the input-event handler is debounced).
    await Promise.resolve();
    expect(plugin.engine.search).toHaveBeenCalledTimes(1);

    modal.inputEl.value = "b";
    modal.inputEl.dispatch("input");
    vi.advanceTimersByTime(50); // still well within the debounce window
    modal.inputEl.value = "br";
    modal.inputEl.dispatch("input");
    vi.advanceTimersByTime(50);
    modal.inputEl.value = "bre";
    modal.inputEl.dispatch("input");

    // No additional search yet - each keystroke reset the debounce timer.
    expect(plugin.engine.search).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(150); // past QUERY_DEBOUNCE_MS (120ms)
    await Promise.resolve();

    // Exactly ONE additional search call for the whole 3-keystroke burst,
    // using the final input value - not one call per keystroke.
    expect(plugin.engine.search).toHaveBeenCalledTimes(2);
    expect(plugin.engine.search).toHaveBeenLastCalledWith("bre", 50, expect.any(Function));
  });

  it("only renders the most recently issued query's results, even if an older query's search resolves later", async () => {
    // Controlled promises so we can resolve the OLDER query's search AFTER
    // the NEWER one, and confirm the stale-token guard still discards the
    // older render - this correctness property must survive both the
    // debounce AND the escalation-cancellation added in optimization #1.
    vi.useFakeTimers();
    const pending = new Map();
    const plugin = makeFakePlugin(app, (query) => {
      return new Promise((resolve) => {
        pending.set(query, () =>
          resolve({
            results: [{ notePath: `${query}.md`, snippet: "", titel: query, sektion: "", seitencode: "", rank: 0, score: 1 }],
            correction: null,
            expandedTerms: [query],
          })
        );
      });
    });

    const modal = new VaultSearchModal(app, plugin);
    modal.open();
    pending.get("")?.(); // resolve the initial empty-query search from open()
    await Promise.resolve();
    await Promise.resolve();

    modal.inputEl.value = "old";
    modal.inputEl.dispatch("input");
    vi.advanceTimersByTime(150); // flush debounce -> search call #1 ("old"), left pending

    modal.inputEl.value = "new";
    modal.inputEl.dispatch("input");
    vi.advanceTimersByTime(150); // flush debounce -> search call #2 ("new"), left pending

    // Resolve the NEWER query first, then the OLDER one - out-of-order
    // completion is exactly what the stale-token guard must handle.
    pending.get("new")();
    await Promise.resolve();
    await Promise.resolve();
    pending.get("old")();
    await Promise.resolve();
    await Promise.resolve();

    expect(modal.results).toEqual([
      expect.objectContaining({ notePath: "new.md" }),
    ]);
  });
});
