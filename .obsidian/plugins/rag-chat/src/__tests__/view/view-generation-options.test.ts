import { describe, expect, it, vi } from "vitest";
import { fake, makeView } from "./harness";


describe("RagChatView", () => {
  describe("generation options (thinking & web search)", () => {
    it("renders unchecked thinking and web-search checkboxes by default", async () => {
      const { view } = makeView();
      await view.onOpen();

      const checkboxes = fake(view.contentEl).querySelectorAll("input.rag-chat-option-checkbox") as any[];
      expect(checkboxes).toHaveLength(2);
      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(false);
    });

    it("toggling the thinking checkbox persists settings.thinkingEnabled", async () => {
      const { view, plugin } = makeView();
      await view.onOpen();

      const checkboxes = fake(view.contentEl).querySelectorAll("input.rag-chat-option-checkbox") as any[];
      const thinkingCheckbox = checkboxes[0];
      thinkingCheckbox.checked = true;
      thinkingCheckbox.dispatch("change");

      expect(plugin.settings.thinkingEnabled).toBe(true);
      expect(plugin.saveSettings).toHaveBeenCalled();
    });

    it("toggling the web-search checkbox persists settings.webSearchEnabled", async () => {
      const { view, plugin } = makeView();
      await view.onOpen();

      const checkboxes = fake(view.contentEl).querySelectorAll("input.rag-chat-option-checkbox") as any[];
      const webSearchCheckbox = checkboxes[1];
      webSearchCheckbox.checked = true;
      webSearchCheckbox.dispatch("change");

      expect(plugin.settings.webSearchEnabled).toBe(true);
      expect(plugin.saveSettings).toHaveBeenCalled();
    });
  });

});
