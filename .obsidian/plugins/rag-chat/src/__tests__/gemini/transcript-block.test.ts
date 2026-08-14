import { describe, expect, it } from "vitest";
import { extractFinalTranscript, splitTranscriptBlock } from "../../gemini/transcript-block";

describe("splitTranscriptBlock", () => {
  it("reports incomplete when no start marker is present yet", () => {
    expect(splitTranscriptBlock("Anzugs")).toEqual({ transcriptComplete: false });
  });

  it("reports incomplete while the block is still open", () => {
    const result = splitTranscriptBlock("%%%TRANSCRIPT_START%%%Anzugsdrehmoment");
    expect(result.transcriptComplete).toBe(false);
    expect(result.transcript).toBeUndefined();
  });

  it("extracts the trimmed transcript once both markers close", () => {
    const result = splitTranscriptBlock("%%%TRANSCRIPT_START%%%\nAnzugsdrehmoment?\n%%%TRANSCRIPT_END%%%");
    expect(result.transcriptComplete).toBe(true);
    expect(result.transcript).toBe("Anzugsdrehmoment?");
  });

  it("extracts an empty transcript when no speech was recognized", () => {
    const result = splitTranscriptBlock("%%%TRANSCRIPT_START%%%%%%TRANSCRIPT_END%%%");
    expect(result.transcriptComplete).toBe(true);
    expect(result.transcript).toBe("");
  });
});

describe("extractFinalTranscript", () => {
  it("extracts the marker-wrapped transcript when present", () => {
    const text = "%%%TRANSCRIPT_START%%%Anzugsdrehmoment?%%%TRANSCRIPT_END%%%";
    expect(extractFinalTranscript(text)).toBe("Anzugsdrehmoment?");
  });

  it("falls back to the trimmed raw text when the model omitted the markers", () => {
    expect(extractFinalTranscript("  Anzugsdrehmoment?  ")).toBe("Anzugsdrehmoment?");
  });
});
