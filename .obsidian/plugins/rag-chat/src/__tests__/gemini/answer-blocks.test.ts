import { describe, expect, it } from "vitest";
import { extractFinalAnswer, splitAnswerBlocks } from "../../gemini/answer-blocks";

describe("splitAnswerBlocks", () => {
  it("returns the raw trimmed text as the answer when no markers are present", () => {
    expect(splitAnswerBlocks("  Zylinderkopfschrauben: 30 Nm.  ")).toEqual({
      shortAnswerComplete: false,
      answer: "Zylinderkopfschrauben: 30 Nm.",
    });
  });

  it("reports an incomplete short answer with no answer text while the short block is still open", () => {
    const result = splitAnswerBlocks("%%%SHORT_ANSWER_START%%%\nZylinderkopf: 30 Nm");
    expect(result.shortAnswerComplete).toBe(false);
    expect(result.answer).toBe("");
  });

  it("extracts the completed short answer and everything after it as answer once the answer block streams in", () => {
    const text =
      "%%%SHORT_ANSWER_START%%%\nZylinderkopfschrauben mit 30 Nm anziehen.\n%%%SHORT_ANSWER_END%%%\n" +
      "%%%ANSWER_START%%%\nVolle Antwort mit [Seite 16-02].";
    const result = splitAnswerBlocks(text);
    expect(result.shortAnswerComplete).toBe(true);
    expect(result.shortAnswer).toBe("Zylinderkopfschrauben mit 30 Nm anziehen.");
    expect(result.answer).toBe("Volle Antwort mit [Seite 16-02].");
  });

  it("strips the closing ANSWER_END marker once the answer block finishes", () => {
    const text =
      "%%%SHORT_ANSWER_START%%%Kurz.%%%SHORT_ANSWER_END%%%%%%ANSWER_START%%%Lang.%%%ANSWER_END%%%";
    const result = splitAnswerBlocks(text);
    expect(result.answer).toBe("Lang.");
  });
});

describe("extractFinalAnswer", () => {
  it("passes plain text through unchanged when no markers were requested", () => {
    expect(extractFinalAnswer("Zylinderkopfschrauben: 30 Nm.")).toEqual({
      text: "Zylinderkopfschrauben: 30 Nm.",
    });
  });

  it("splits a well-formed short/answer pair", () => {
    const text =
      "%%%SHORT_ANSWER_START%%%Kurze Antwort.%%%SHORT_ANSWER_END%%%" +
      "%%%ANSWER_START%%%Lange Antwort.%%%ANSWER_END%%%";
    expect(extractFinalAnswer(text)).toEqual({ text: "Lange Antwort.", shortAnswer: "Kurze Antwort." });
  });

  it("falls back to the marker-stripped full text when the short block was never closed", () => {
    const text = "%%%SHORT_ANSWER_START%%%Kurze Antwort ohne Ende, Modell hat Format verfehlt.";
    const result = extractFinalAnswer(text);
    expect(result.shortAnswer).toBeUndefined();
    expect(result.text).toBe("Kurze Antwort ohne Ende, Modell hat Format verfehlt.");
  });
});
