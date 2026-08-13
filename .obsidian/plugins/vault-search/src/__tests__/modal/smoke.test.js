import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian.js");
  return mock;
});

beforeAll(() => {
  if (typeof globalThis.window === "undefined") {
    globalThis.window = globalThis;
  }
});

let VaultSearchModal;
beforeAll(async () => {
  ({ VaultSearchModal } = await import("../../main.js"));
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
    await Promise.resolve();
    expect(plugin.engine.search).toHaveBeenCalledTimes(1);

    modal.inputEl.value = "b";
    modal.inputEl.dispatch("input");
    vi.advanceTimersByTime(50);
    modal.inputEl.value = "br";
    modal.inputEl.dispatch("input");
    vi.advanceTimersByTime(50);
    modal.inputEl.value = "bre";
    modal.inputEl.dispatch("input");

    expect(plugin.engine.search).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(150);
    await Promise.resolve();

    expect(plugin.engine.search).toHaveBeenCalledTimes(2);
    expect(plugin.engine.search).toHaveBeenLastCalledWith("bre", 50, expect.any(Function));
  });

  it("only renders the most recently issued query's results, even if an older query's search resolves later", async () => {
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
    pending.get("")?.();
    await Promise.resolve();
    await Promise.resolve();

    modal.inputEl.value = "old";
    modal.inputEl.dispatch("input");
    vi.advanceTimersByTime(150);

    modal.inputEl.value = "new";
    modal.inputEl.dispatch("input");
    vi.advanceTimersByTime(150);

    pending.get("new")();
    await Promise.resolve();
    await Promise.resolve();
    pending.get("old")();
    await Promise.resolve();
    await Promise.resolve();

    expect(modal.results).toEqual([expect.objectContaining({ notePath: "new.md" })]);
  });
});
