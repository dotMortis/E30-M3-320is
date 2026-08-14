import { listFlashModels } from "../gemini/models";

export interface ModelOptionsDeps {
  selectEl: HTMLSelectElement;
  apiKey: string;
  currentModel: string;
  isClosed: () => boolean;
  isBusy: () => boolean;
  setDisabled: (disabled: boolean) => void;
}

export async function refreshModelOptions(deps: ModelOptionsDeps): Promise<void> {
  deps.selectEl.disabled = true;
  deps.setDisabled(true);

  const models = await listFlashModels(deps.apiKey);
  if (deps.isClosed()) return;

  const options = models.some((model) => model.id === deps.currentModel)
    ? models
    : [{ id: deps.currentModel, displayName: deps.currentModel }, ...models];

  deps.selectEl.empty();
  for (const model of options) {
    deps.selectEl.createEl("option", { attr: { value: model.id }, text: model.displayName });
  }
  deps.selectEl.value = deps.currentModel;
  deps.selectEl.disabled = deps.isBusy();
  deps.setDisabled(deps.isBusy());
}
