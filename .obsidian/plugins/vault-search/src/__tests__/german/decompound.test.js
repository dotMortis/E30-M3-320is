import { describe, it, expect } from "vitest";
import { decompound, decompoundCached } from "../../german/decompound.js";

describe("decompound", () => {
  const dict = new Set(["kraftstoff", "tank", "riemen", "keil"]);

  it("splits a known compound into its dictionary parts", () => {
    expect(decompound("kraftstofftank", dict)).toEqual(["kraftstoff", "tank"]);
  });

  it("returns null for tokens shorter than MIN_TOKEN_TO_SPLIT", () => {
    expect(decompound("tank", dict)).toBeNull();
  });

  it("returns null when no valid split exists", () => {
    expect(decompound("quantenmechanik", dict)).toBeNull();
  });

  it("never splits off a denied verb prefix as the left part", () => {
    const dictWithAus = new Set(["aus", "bauen", "bau"]);
    expect(decompound("ausbauen", dictWithAus)).toBeNull();
  });
});

describe("decompoundCached", () => {
  it("returns the same result as decompound() for the same token/dict", () => {
    const dict = new Set(["kraftstoff", "tank"]);
    expect(decompoundCached("kraftstofftank", dict)).toEqual(decompound("kraftstofftank", dict));
  });

  it("keeps a repeated call's result identical (cache hit) for the same dict instance", () => {
    const dict = new Set(["kraftstoff", "tank"]);
    const first = decompoundCached("kraftstofftank", dict);
    const second = decompoundCached("kraftstofftank", dict);
    expect(second).toEqual(first);
  });

  it("does not leak a cached result across two different dict instances for the same token", () => {
    const dictWithSplit = new Set(["kraftstoff", "tank"]);
    const dictWithoutSplit = new Set(["irgendwas"]);
    expect(decompoundCached("kraftstofftank", dictWithSplit)).toEqual(["kraftstoff", "tank"]);
    expect(decompoundCached("kraftstofftank", dictWithoutSplit)).toBeNull();
  });
});
