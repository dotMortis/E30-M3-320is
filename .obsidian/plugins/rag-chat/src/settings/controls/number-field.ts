import { Setting } from "obsidian";

export interface NumberFieldConfig {
  name: string;
  desc?: string;
  getValue: () => number;
  parse?: (raw: string) => number;
  isValid: (n: number) => boolean;
  onValid: (n: number) => Promise<void> | void;
}

export function addNumberField(containerEl: HTMLElement, config: NumberFieldConfig): Setting {
  const parse = config.parse ?? ((raw: string) => parseInt(raw, 10));
  const setting = new Setting(containerEl).setName(config.name);
  if (config.desc) setting.setDesc(config.desc);

  setting.addText((text) =>
    text.setValue(String(config.getValue())).onChange(async (value) => {
      const n = parse(value);
      if (!Number.isNaN(n) && config.isValid(n)) {
        await config.onValid(n);
      }
    }),
  );

  return setting;
}
