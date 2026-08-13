/**
 * search-engine.cache.test.js — tests the small per-query LRU cache added
 * to SearchEngine.search() (see ../main.js, optimization #8). Spies on
 * search.js's `runSearch` (via a partial module mock) to verify the cache
 * actually short-circuits repeat work, not just that results look right.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { createFakeApp } from "./mocks/fakeVault.js";

vi.mock("obsidian", async () => {
  const mock = await import("./mocks/obsidian.js");
  return mock;
});

vi.mock("../search.js", async () => {
  const actual = await vi.importActual("../search.js");
  return { ...actual, runSearch: vi.fn(actual.runSearch) };
});

let SearchEngine;
let runSearchSpy;
beforeAll(async () => {
  ({ SearchEngine } = await import("../main.js"));
  ({ runSearch: runSearchSpy } = await import("../search.js"));
});

const NOTE = {
  rowId: "brakes.md",
  notePath: "brakes.md",
  code: "07-100",
  titel: "Bremse pruefen",
  titleEn: "",
  section: "Bremsanlage",
  tags: ["bremse"],
  content: "Bremsbelaege auf Verschleiss pruefen.",
};

async function makeEngine() {
  const app = createFakeApp([NOTE], {
    dataFiles: { "data/synonyms.json": [], "data/compound-parts.json": {} },
  });
  const engine = new SearchEngine(app, ".obsidian/plugins/vault-search");
  await engine.ensureBuilt();
  return engine;
}

describe("SearchEngine query cache (optimization #8)", () => {
  beforeEach(() => {
    runSearchSpy.mockClear();
  });

  it("serves a repeat query from cache instead of re-running runSearch", async () => {
    const engine = await makeEngine();

    const first = await engine.search("bremse", 10);
    expect(runSearchSpy).toHaveBeenCalledTimes(1);

    const second = await engine.search("bremse", 10);
    expect(runSearchSpy).toHaveBeenCalledTimes(1); // still 1 - served from cache
    expect(second).toEqual(first);
  });

  it("treats different limits as different cache entries", async () => {
    const engine = await makeEngine();
    await engine.search("bremse", 10);
    await engine.search("bremse", 5);
    expect(runSearchSpy).toHaveBeenCalledTimes(2);
  });

  it("does not cache a result that was superseded (shouldAbort true)", async () => {
    const engine = await makeEngine();

    await engine.search("bremse", 10, () => true); // immediately-stale query
    expect(runSearchSpy).toHaveBeenCalledTimes(1);

    // Same query text/limit, but NOT stale this time - must re-run, not
    // serve the (never-cached) aborted result.
    await engine.search("bremse", 10, () => false);
    expect(runSearchSpy).toHaveBeenCalledTimes(2);

    // Now that a non-aborted result WAS cached, a further identical call
    // should hit the cache.
    await engine.search("bremse", 10, () => false);
    expect(runSearchSpy).toHaveBeenCalledTimes(2);
  });

  it("clears the cache on rebuild()", async () => {
    const engine = await makeEngine();
    await engine.search("bremse", 10);
    expect(runSearchSpy).toHaveBeenCalledTimes(1);

    await engine.rebuild();

    await engine.search("bremse", 10);
    expect(runSearchSpy).toHaveBeenCalledTimes(2);
  });

  it("evicts the least-recently-used entry once the cache exceeds its max size", async () => {
    const engine = await makeEngine();
    // Fill the cache with 21 distinct queries (max is 20) - "query-0" (the
    // least recently used) should be evicted, so searching it again must
    // re-run runSearch instead of hitting the cache.
    for (let i = 0; i < 21; i++) {
      await engine.search(`query-${i}`, 10);
    }
    const callsAfterFill = runSearchSpy.mock.calls.length;

    await engine.search("query-0", 10); // evicted - cache miss
    expect(runSearchSpy).toHaveBeenCalledTimes(callsAfterFill + 1);

    runSearchSpy.mockClear();
    await engine.search("query-20", 10); // most recent of the fill - still cached
    expect(runSearchSpy).not.toHaveBeenCalled();
  });
});
