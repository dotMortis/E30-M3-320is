import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSettings } from "../fixtures/settings";

const generatePlainText = vi.fn();
vi.mock("../../gemini/client", () => ({ generatePlainText }));

let buildShortAnswer: typeof import("../../tts/short-answer").buildShortAnswer;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ buildShortAnswer } = await import("../../tts/short-answer"));
});

describe("buildShortAnswer", () => {
  it("returns the trimmed long answer unchanged when short and free of citation markup (fast path)", async () => {
    const result = await buildShortAnswer("  Zylinderkopfschrauben: 30 Nm.  ", fakeSettings());
    expect(result).toBe("Zylinderkopfschrauben: 30 Nm.");
    expect(generatePlainText).not.toHaveBeenCalled();
  });

  it("calls generatePlainText when the long answer exceeds the short-answer char threshold", async () => {
    const longText = "A".repeat(300);
    generatePlainText.mockResolvedValue("Kurze Antwort.");
    const result = await buildShortAnswer(longText, fakeSettings());
    expect(result).toBe("Kurze Antwort.");
    expect(generatePlainText).toHaveBeenCalledTimes(1);
  });

  it("calls generatePlainText for a short answer containing '[Seite ...]' citation markup", async () => {
    generatePlainText.mockResolvedValue("Kurze Antwort.");
    await buildShortAnswer("30 Nm [Seite 12].", fakeSettings());
    expect(generatePlainText).toHaveBeenCalledTimes(1);
  });

  it("calls generatePlainText for a short answer containing '[Referenz: ...]' citation markup", async () => {
    generatePlainText.mockResolvedValue("Kurze Antwort.");
    await buildShortAnswer("30 Nm [Referenz: Handbuch S.5].", fakeSettings());
    expect(generatePlainText).toHaveBeenCalledTimes(1);
  });

  it("builds the prompt with the fixed summarization instruction plus the long text", async () => {
    const longText = "A".repeat(300);
    generatePlainText.mockResolvedValue("Kurz.");
    await buildShortAnswer(longText, fakeSettings());
    const contents = generatePlainText.mock.calls[0][0];
    expect(contents[0].role).toBe("user");
    expect(contents[0].parts[0].text).toContain("Fasse die folgende Antwort für eine Sprachausgabe");
    expect(contents[0].parts[0].text).toContain(longText);
  });

  it("passes settings and an AbortSignal through to generatePlainText", async () => {
    const longText = "A".repeat(300);
    generatePlainText.mockResolvedValue("Kurz.");
    const settings = fakeSettings();
    const controller = new AbortController();
    await buildShortAnswer(longText, settings, { signal: controller.signal });
    expect(generatePlainText).toHaveBeenCalledWith(expect.anything(), settings, { signal: controller.signal });
  });

  it("trims the result returned from generatePlainText", async () => {
    const longText = "A".repeat(300);
    generatePlainText.mockResolvedValue("  Kurze Antwort.  ");
    const result = await buildShortAnswer(longText, fakeSettings());
    expect(result).toBe("Kurze Antwort.");
  });
});
