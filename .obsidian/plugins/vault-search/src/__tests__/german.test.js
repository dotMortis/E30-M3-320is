/**
 * german.test.js — unit tests for the pure-function German text
 * normalisation / query-expansion utilities (see ../german.js). No
 * Obsidian or Orama dependency, so these run as plain function-in,
 * value-out tests independent of the search harness.
 */
import { describe, it, expect } from "vitest";
import {
  fold,
  tokenize,
  contentTokens,
  stripForContent,
  decompound,
  decompoundCached,
  synthesizeSeparableVerbs,
  synthesizeJoinedCompounds,
  verbStemCandidates,
  buildSynonymMap,
  expandSynonyms,
  buildDictionary,
  expandQuery,
  expandQueryConcepts,
  STOPWORDS,
} from "../german.js";

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
    // "wie"/"ich"/"den"/"ein" are all stopwords (interrogative, pronoun,
    // article, indefinite article respectively) - "baue" and "tank" are
    // the only real content words left.
    expect(contentTokens("wie baue ich den Tank ein")).toEqual(["baue", "tank"]);
  });
});

describe("stripForContent", () => {
  it("removes YAML frontmatter", () => {
    const raw = "---\ntitel: Foo\n---\nHallo Welt";
    expect(stripForContent(raw)).toBe("Hallo Welt");
  });

  it("resolves wikilinks to their display text and drops embeds/markdown noise", () => {
    const raw = "Siehe ![[bild.png]] und [[13-710|Kraftstoffdruck]] # Ueberschrift";
    const out = stripForContent(raw);
    expect(out).toContain("Kraftstoffdruck");
    expect(out).not.toContain("[[");
    expect(out).not.toContain("![[");
  });
});

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
    // "ausbauen" (8 chars, meets MIN_TOKEN_TO_SPLIT) must not be split into
    // "aus" + "bauen" even if "aus" and "bau"/"bauen" were dictionary words -
    // SPLIT_PREFIX_DENY blocks "aus" as a left part specifically.
    const dictWithAus = new Set(["aus", "bauen", "bau"]);
    expect(decompound("ausbauen", dictWithAus)).toBeNull();
  });
});

describe("decompoundCached (optimization #8)", () => {
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
    const dictWithoutSplit = new Set(["irgendwas"]); // no valid split possible
    expect(decompoundCached("kraftstofftank", dictWithSplit)).toEqual(["kraftstoff", "tank"]);
    expect(decompoundCached("kraftstofftank", dictWithoutSplit)).toBeNull();
  });
});

describe("verbStemCandidates", () => {
  it("strips common present-tense endings and keeps the original word", () => {
    const stems = verbStemCandidates("baue");
    expect(stems.has("baue")).toBe(true);
    expect(stems.has("bau")).toBe(true);
  });
});

describe("synthesizeSeparableVerbs", () => {
  it("bridges a separated prefix+verb to the literal infinitive when gated by vocabulary", () => {
    const vocabulary = new Set(["einbauen"]);
    const tokens = tokenize("wie baue ich den tank ein");
    expect(synthesizeSeparableVerbs(tokens, vocabulary)).toEqual(["einbauen"]);
  });

  it("returns nothing when the candidate is not in vocabulary", () => {
    const vocabulary = new Set(["irgendwas"]);
    const tokens = tokenize("wie baue ich den tank ein");
    expect(synthesizeSeparableVerbs(tokens, vocabulary)).toEqual([]);
  });

  it("returns nothing when no separable prefix is present in the query", () => {
    const vocabulary = new Set(["einbauen"]);
    const tokens = tokenize("tank pruefen");
    expect(synthesizeSeparableVerbs(tokens, vocabulary)).toEqual([]);
  });
});

describe("synthesizeJoinedCompounds", () => {
  it("joins adjacent content words with a valid Fugenelement when gated by vocabulary", () => {
    const vocabulary = new Set(["kraftstofftank"]);
    expect(synthesizeJoinedCompounds(["kraftstoff", "tank"], vocabulary)).toEqual(["kraftstofftank"]);
  });

  it("returns nothing when the joined form is not in vocabulary", () => {
    expect(synthesizeJoinedCompounds(["kraftstoff", "tank"], new Set())).toEqual([]);
  });
});

describe("buildSynonymMap / expandSynonyms", () => {
  it("links COLLOQUIAL_GROUPS bidirectionally", () => {
    const map = buildSynonymMap([], []);
    expect(expandSynonyms(map, "benzin")).toContain("kraftstoff");
    expect(expandSynonyms(map, "kraftstoff")).toContain("benzin");
  });

  it("links glossary de/en/variants (single-token phrases only)", () => {
    const map = buildSynonymMap([{ de: "keilriemen", en: "vbelt", variants: ["antriebsriemen"] }], []);
    expect(expandSynonyms(map, "keilriemen")).toEqual(
      expect.arrayContaining(["vbelt", "antriebsriemen", "riemen"])
    );
  });

  it("links pre-folded OpenThesaurus-style pairs directly", () => {
    const map = buildSynonymMap([], [["foo", "bar"]]);
    expect(expandSynonyms(map, "foo")).toEqual(["bar"]);
    expect(expandSynonyms(map, "bar")).toEqual(["foo"]);
  });

  it("never links a stopword", () => {
    const map = buildSynonymMap([], [["und", "bar"]]);
    expect(expandSynonyms(map, "und")).toEqual([]);
  });
});

describe("buildDictionary", () => {
  it("collects title/tag tokens and synonym-map keys, excluding stopwords/short tokens", () => {
    // "schlauch"/"rohr" (both >= MIN_PART_LEN=4) stand in for an arbitrary
    // OpenThesaurus-style pair; "foo"/"bar" would be silently dropped since
    // buildDictionary's addDict() also enforces the 4-char minimum.
    const synonymMap = buildSynonymMap([], [["schlauch", "rohr"]]);
    const dict = buildDictionary([tokenize("Kraftstofftank"), tokenize("und")], synonymMap);
    expect(dict.has("kraftstofftank")).toBe(true);
    expect(dict.has("schlauch")).toBe(true);
    expect(dict.has("und")).toBe(false);
  });
});

describe("expandQuery", () => {
  it("includes literal content tokens and excludes stopwords", () => {
    const synonymMap = new Map();
    const dict = new Set();
    const expanded = expandQuery("wie funktioniert die bremse", synonymMap, dict, new Set(), {});
    expect(expanded).toContain("bremse");
    expect(expanded).not.toContain("wie");
    expect(expanded).not.toContain("die");
  });

  it("prefers a precomputed compound split over live decompound()", () => {
    const synonymMap = new Map();
    const dict = new Set(); // deliberately empty - live decompound() would fail
    const compoundParts = { kraftstofftank: ["kraftstoff", "tank"] };
    const expanded = expandQuery("kraftstofftank", synonymMap, dict, new Set(), compoundParts);
    expect(expanded).toEqual(expect.arrayContaining(["kraftstoff", "tank"]));
  });

  it("skips decompounding when a curated synonym already matched", () => {
    // Regression guard for the documented keilriemen/riemen/keil ordering
    // bug (see german.js's expandQuery doc-comment): once "keilriemen" has
    // a synonym, it must NOT also be decompounded into "keil"+"riemen".
    const synonymMap = buildSynonymMap([], []); // includes keilriemen<->riemen via COLLOQUIAL_GROUPS
    const dict = new Set(["keil", "riemen"]);
    const expanded = expandQuery("keilriemen", synonymMap, dict, new Set(), {});
    expect(expanded).toContain("antriebsriemen");
    expect(expanded).not.toContain("keil");
  });
});

describe("expandQueryConcepts", () => {
  it("groups terms by originating concept, one per distinct content word", () => {
    const synonymMap = buildSynonymMap([], []);
    const dict = new Set();
    const concepts = expandQueryConcepts("benzin einbauen", synonymMap, dict, new Set(["einbauen"]), {});
    expect(concepts.map((c) => c.raw)).toEqual(["benzin", "einbauen"]);
    const benzinConcept = concepts.find((c) => c.raw === "benzin");
    expect(benzinConcept.terms).toContain("kraftstoff");
  });

  it("returns a single concept (no grouping needed) for a one-word query", () => {
    const concepts = expandQueryConcepts("bremse", new Map(), new Set(), new Set(), {});
    expect(concepts.length).toBe(1);
    expect(concepts[0].raw).toBe("bremse");
  });
});

describe("STOPWORDS", () => {
  it("includes interrogatives and common prepositions", () => {
    expect(STOPWORDS.has("wie")).toBe(true);
    expect(STOPWORDS.has("hinter")).toBe(true);
  });
});
