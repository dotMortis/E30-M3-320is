import { describe, it, expect } from "vitest";
import { STOPWORDS } from "../../german/stopwords.js";

describe("STOPWORDS", () => {
  it("includes interrogatives and common prepositions", () => {
    expect(STOPWORDS.has("wie")).toBe(true);
    expect(STOPWORDS.has("hinter")).toBe(true);
  });
});
