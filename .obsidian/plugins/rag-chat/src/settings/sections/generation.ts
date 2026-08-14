import { Setting, type ButtonComponent, type DropdownComponent } from "obsidian";
import type RagChatPlugin from "../../main";
import { listFlashModels } from "../../gemini/models";

export function renderGenerationModel(containerEl: HTMLElement, plugin: RagChatPlugin): void {
  let modelDropdown: DropdownComponent | undefined;
  let modelRefreshButton: ButtonComponent | undefined;

  const refreshModelOptions = async (): Promise<void> => {
    if (!modelDropdown) return;
    const currentModel = plugin.settings.generationModel;
    modelDropdown.setDisabled(true);
    modelRefreshButton?.setDisabled(true);

    const models = await listFlashModels(plugin.settings.geminiApiKey);
    const options = models.some((model) => model.id === currentModel)
      ? models
      : [{ id: currentModel, displayName: currentModel }, ...models];

    modelDropdown.selectEl.empty();
    for (const model of options) modelDropdown.addOption(model.id, model.displayName);
    modelDropdown.setValue(currentModel);
    modelDropdown.setDisabled(false);
    modelRefreshButton?.setDisabled(false);
  };

  new Setting(containerEl)
    .setName("Generation model")
    .addDropdown((dropdown) => {
      modelDropdown = dropdown;
      dropdown.addOption(plugin.settings.generationModel, plugin.settings.generationModel);
      dropdown.setValue(plugin.settings.generationModel);
      dropdown.onChange(async (value) => {
        plugin.settings.generationModel = value;
        await plugin.saveSettings();
      });
    })
    .addButton((button) => {
      modelRefreshButton = button;
      button.setIcon("refresh-cw").setTooltip("Modellliste aktualisieren");
      button.onClick(() => {
        void refreshModelOptions();
      });
    });

  void refreshModelOptions();
}
