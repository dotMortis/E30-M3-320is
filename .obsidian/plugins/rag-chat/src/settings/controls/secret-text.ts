import { Setting } from "obsidian";

export interface SecretTextConfig {
  name: string;
  desc?: string;
  placeholder?: string;
  getValue: () => string;
  setValue: (value: string) => Promise<void> | void;
}

export function addSecretText(containerEl: HTMLElement, config: SecretTextConfig): Setting {
  let inputEl: HTMLInputElement | undefined;
  const setting = new Setting(containerEl).setName(config.name);
  if (config.desc) setting.setDesc(config.desc);

  setting
    .addText((text) => {
      text
        .setPlaceholder(config.placeholder ?? "AIza...")
        .setValue(config.getValue())
        .onChange(async (value) => {
          await config.setValue(value.trim());
        });
      inputEl = text.inputEl;
      inputEl.type = "password";
    })
    .addButton((button) => {
      button.setIcon("eye").setTooltip("API-Schlüssel anzeigen/verbergen");
      button.onClick(() => {
        if (!inputEl) return;
        const revealed = inputEl.type === "text";
        inputEl.type = revealed ? "password" : "text";
        button.setIcon(revealed ? "eye" : "eye-off");
      });
    });

  return setting;
}
