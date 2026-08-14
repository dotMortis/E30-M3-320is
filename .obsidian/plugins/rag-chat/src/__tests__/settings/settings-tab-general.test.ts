import { describe, expect, it, vi } from "vitest";
import { ButtonComponent, DropdownComponent, Setting, TextComponent } from "../mocks/obsidian";
import { listModelsResponse, mockRequestUrlSequence, requestUrl } from "../mocks/gemini-http";
import { makeTab } from "./settings-tab-harness";

describe("RagChatSettingTab.display (general & retrieval)", () => {
  it("renders a heading and description", () => {
    const { containerEl } = makeTab();
    expect(containerEl.children.some((c) => c.tag === "h2" && c.text === "RAG Chat")).toBe(true);
  });

  it("creates exactly 16 Setting rows", () => {
    makeTab();
    expect(Setting.instances).toHaveLength(16);
  });

  it("pre-fills the API key field with the current setting value", () => {
    const { plugin } = makeTab();
    const apiKeyText = Setting.instances[0].components[0] as TextComponent;
    expect(apiKeyText.value).toBe(plugin.settings.geminiApiKey);
  });

  it("masks the API key input as a password field", () => {
    makeTab();
    const apiKeyText = Setting.instances[0].components[0] as TextComponent;
    expect(apiKeyText.inputEl.type).toBe("password");
  });

  it("reveals the API key as plain text when the reveal button is clicked, then re-masks on a second click", async () => {
    makeTab();
    const apiKeyText = Setting.instances[0].components[0] as TextComponent;
    const revealButton = Setting.instances[0].components[1] as ButtonComponent;
    expect(apiKeyText.inputEl.type).toBe("password");

    await revealButton.triggerClick();
    expect(apiKeyText.inputEl.type).toBe("text");

    await revealButton.triggerClick();
    expect(apiKeyText.inputEl.type).toBe("password");
  });

  it("updates and trims settings.geminiApiKey on change, then saves", async () => {
    const { plugin } = makeTab();
    const apiKeyText = Setting.instances[0].components[0] as TextComponent;
    await apiKeyText.triggerChange("  new-key-value  ");
    expect(plugin.settings.geminiApiKey).toBe("new-key-value");
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });

  it("updates settings.embeddingModel on change", async () => {
    const { plugin } = makeTab();
    const text = Setting.instances[1].components[0] as TextComponent;
    await text.triggerChange("gemini-embedding-3");
    expect(plugin.settings.embeddingModel).toBe("gemini-embedding-3");
  });

  it("re-validates the manifest after an embeddingModel change (parity can silently break live)", async () => {
    const { plugin } = makeTab();
    const text = Setting.instances[1].components[0] as TextComponent;
    await text.triggerChange("gemini-embedding-3");
    expect(plugin.revalidateManifest).toHaveBeenCalledTimes(1);
  });

  it("pre-fills the generation model dropdown with the current setting value", () => {
    const { plugin } = makeTab();
    const dropdown = Setting.instances[2].components[0] as DropdownComponent;
    expect(dropdown.getValue()).toBe(plugin.settings.generationModel);
  });

  it("updates and saves settings.generationModel on change", async () => {
    const { plugin } = makeTab();
    const dropdown = Setting.instances[2].components[0] as DropdownComponent;
    await dropdown.triggerChange("gemini-4.0-flash");
    expect(plugin.settings.generationModel).toBe("gemini-4.0-flash");
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });

  it("populates the generation model dropdown with flash models fetched from the API, keeping the current model selected", async () => {
    mockRequestUrlSequence([
      listModelsResponse([
        { name: "models/gemini-3.6-flash", displayName: "Gemini 3.6 Flash", supportedGenerationMethods: ["generateContent"] },
        { name: "models/gemini-2.5-flash", displayName: "Gemini 2.5 Flash", supportedGenerationMethods: ["generateContent"] },
      ]),
    ]);
    const { plugin } = makeTab();
    const dropdown = Setting.instances[2].components[0] as DropdownComponent;

    await vi.waitFor(() => {
      const optionValues = dropdown.selectEl.children.map((c) => c.attrs.value);
      expect(optionValues).toEqual(["gemini-3.6-flash", "gemini-2.5-flash"]);
    });
    expect(dropdown.getValue()).toBe(plugin.settings.generationModel);
  });

  it("adds the current model to the dropdown when it is not already present in the fetched list", async () => {
    mockRequestUrlSequence([
      listModelsResponse([
        { name: "models/gemini-2.5-flash", displayName: "Gemini 2.5 Flash", supportedGenerationMethods: ["generateContent"] },
      ]),
    ]);
    const { plugin } = makeTab();
    const dropdown = Setting.instances[2].components[0] as DropdownComponent;

    await vi.waitFor(() => {
      const optionValues = dropdown.selectEl.children.map((c) => c.attrs.value);
      expect(optionValues).toContain(plugin.settings.generationModel);
    });
    expect(dropdown.getValue()).toBe(plugin.settings.generationModel);
  });

  it("re-fetches the model list when the refresh button next to the dropdown is clicked", async () => {
    const { plugin } = makeTab();

    await vi.waitFor(() => expect(requestUrl).toHaveBeenCalledTimes(2));

    mockRequestUrlSequence([
      listModelsResponse([
        { name: "models/gemini-3.6-flash", displayName: "Gemini 3.6 Flash", supportedGenerationMethods: ["generateContent"] },
      ]),
    ]);
    const dropdown = Setting.instances[2].components[0] as DropdownComponent;
    const refreshButton = Setting.instances[2].components[1] as ButtonComponent;
    await refreshButton.triggerClick();

    expect(requestUrl).toHaveBeenCalledTimes(3);
    const optionValues = dropdown.selectEl.children.map((c) => c.attrs.value);
    expect(optionValues).toContain("gemini-3.6-flash");
    expect(dropdown.getValue()).toBe(plugin.settings.generationModel);
  });

});
