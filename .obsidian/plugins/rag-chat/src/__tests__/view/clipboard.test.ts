import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "../../view/clipboard";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("copyToClipboard", () => {
  it("writes the text to the clipboard and resolves true", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const ok = await copyToClipboard("Hallo Welt");

    expect(writeText).toHaveBeenCalledWith("Hallo Welt");
    expect(ok).toBe(true);
  });

  it("resolves false when the clipboard write fails", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });

    const ok = await copyToClipboard("Hallo Welt");

    expect(ok).toBe(false);
  });

  it("resolves false when no clipboard API is available", async () => {
    vi.stubGlobal("navigator", {});

    const ok = await copyToClipboard("Hallo Welt");

    expect(ok).toBe(false);
  });
});
