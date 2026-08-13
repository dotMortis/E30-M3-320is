import { describe, it, expect } from "vitest";
import { fold, tokenize, contentTokens } from "../../german/fold.js";

describe("fold", () => {
  it("lowercases and expands umlauts/eszett to ASCII digraphs", () => {
    expect(fold("Kühler")).toBe("kuehler");
    expect(fold("Stoßdämpfer")).toBe("stossdaempfer");
    expect(fold("Über")).toBe("ueber");
  });

  it("handles empty/undefined input", () => {
    expect(fold("")).toBe("");
    expect(fold(undefined)).toBe("");
  });
});

describe("tokenize", () => {
  it("keeps hyphenated note codes together", () => {
    expect(tokenize("Siehe 16-02")).toEqual(["siehe", "16-02"]);
  });

  it("splits on other punctuation and folds umlauts first", () => {
    expect(tokenize("Kühler, Lüfter!")).toEqual(["kuehler", "luefter"]);
  });

  it("returns an empty array for falsy input", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize(null)).toEqual([]);
  });
});

describe("contentTokens", () => {
  it("drops stopwords and short tokens", () => {
    expect(contentTokens("wie baue ich den Tank ein")).toEqual(["baue", "tank"]);
  });
});
