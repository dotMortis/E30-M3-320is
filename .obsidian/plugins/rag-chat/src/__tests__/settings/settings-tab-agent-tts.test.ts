import { describe, expect, it, vi } from "vitest";
import { Setting, TextComponent, ToggleComponent } from "../mocks/obsidian";
import { makeTab } from "./settings-tab-harness";

describe("RagChatSettingTab.display (agent & TTS)", () => {
  it("updates settings.outputDim for a valid positive integer", async () => {
    const { plugin } = makeTab();
    const text = Setting.instances[3].components[0] as TextComponent;
    await text.triggerChange("768");
    expect(plugin.settings.outputDim).toBe(768);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });

  it("re-validates the manifest after an outputDim change (parity can silently break live)", async () => {
    const { plugin } = makeTab();
    const text = Setting.instances[3].components[0] as TextComponent;
    await text.triggerChange("768");
    expect(plugin.revalidateManifest).toHaveBeenCalledTimes(1);
  });

  it("does not re-validate the manifest for a rejected (invalid) outputDim change", async () => {
    const { plugin } = makeTab();
    const text = Setting.instances[3].components[0] as TextComponent;
    await text.triggerChange("not-a-number");
    expect(plugin.revalidateManifest).not.toHaveBeenCalled();
  });

  it("does not re-validate the manifest for unrelated settings changes (e.g. topK)", async () => {
    const { plugin } = makeTab();
    const text = Setting.instances[4].components[0] as TextComponent;
    await text.triggerChange("12");
    expect(plugin.revalidateManifest).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric outputDim without mutating settings or saving", async () => {
    const { plugin } = makeTab();
    const original = plugin.settings.outputDim;
    const text = Setting.instances[3].components[0] as TextComponent;
    await text.triggerChange("not-a-number");
    expect(plugin.settings.outputDim).toBe(original);
    expect(plugin.saveSettings).not.toHaveBeenCalled();
  });

  it("rejects a zero or negative outputDim", async () => {
    const { plugin } = makeTab();
    const original = plugin.settings.outputDim;
    const text = Setting.instances[3].components[0] as TextComponent;
    await text.triggerChange("0");
    expect(plugin.settings.outputDim).toBe(original);
    await text.triggerChange("-5");
    expect(plugin.settings.outputDim).toBe(original);
  });

  it("updates settings.topK for a valid positive integer", async () => {
    const { plugin } = makeTab();
    const text = Setting.instances[4].components[0] as TextComponent;
    await text.triggerChange("12");
    expect(plugin.settings.topK).toBe(12);
  });

  it("updates settings.similarity for a value within [0, 1]", async () => {
    const { plugin } = makeTab();
    const text = Setting.instances[5].components[0] as TextComponent;
    await text.triggerChange("0.7");
    expect(plugin.settings.similarity).toBe(0.7);
  });

  it("rejects a similarity value above 1", async () => {
    const { plugin } = makeTab();
    const original = plugin.settings.similarity;
    const text = Setting.instances[5].components[0] as TextComponent;
    await text.triggerChange("1.5");
    expect(plugin.settings.similarity).toBe(original);
  });

  it("rejects a negative similarity value", async () => {
    const { plugin } = makeTab();
    const original = plugin.settings.similarity;
    const text = Setting.instances[5].components[0] as TextComponent;
    await text.triggerChange("-0.1");
    expect(plugin.settings.similarity).toBe(original);
  });

  it("accepts a similarity value of exactly 0 and exactly 1", async () => {
    const { plugin } = makeTab();
    const text = Setting.instances[5].components[0] as TextComponent;
    await text.triggerChange("0");
    expect(plugin.settings.similarity).toBe(0);
    await text.triggerChange("1");
    expect(plugin.settings.similarity).toBe(1);
  });

  it("updates settings.rrfK for a valid positive integer", async () => {
    const { plugin } = makeTab();
    const text = Setting.instances[6].components[0] as TextComponent;
    await text.triggerChange("5");
    expect(plugin.settings.rrfK).toBe(5);
  });

  it("pre-fills the fuzzy-search toggle with the current setting value", () => {
    const { plugin } = makeTab();
    const toggle = Setting.instances[7].components[0] as ToggleComponent;
    expect(toggle.value).toBe(plugin.settings.enableFuzzySearchLeg);
  });

  it("updates settings.enableFuzzySearchLeg on toggle", async () => {
    const { plugin } = makeTab();
    const toggle = Setting.instances[7].components[0] as ToggleComponent;
    await toggle.triggerChange(false);
    expect(plugin.settings.enableFuzzySearchLeg).toBe(false);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });

  it("updates settings.maxAgentRounds for a valid positive integer", async () => {
    const { plugin } = makeTab();
    const text = Setting.instances[8].components[0] as TextComponent;
    await text.triggerChange("6");
    expect(plugin.settings.maxAgentRounds).toBe(6);
  });

  it("rejects a non-positive maxAgentRounds", async () => {
    const { plugin } = makeTab();
    const original = plugin.settings.maxAgentRounds;
    const text = Setting.instances[8].components[0] as TextComponent;
    await text.triggerChange("0");
    expect(plugin.settings.maxAgentRounds).toBe(original);
  });

  it("clears and re-renders the container each time display() is called", () => {
    const { tab, containerEl } = makeTab();
    const firstChildCount = containerEl.children.length;
    tab.display();
    expect(containerEl.children.length).toBe(firstChildCount);
  });
});
