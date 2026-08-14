import type { FakeElement } from "../dom";

export class SliderComponent {
  el: FakeElement;
  value = 0;
  private changeHandler?: (value: number) => void | Promise<void>;

  constructor(containerEl: FakeElement) {
    this.el = containerEl.createEl("input", { attr: { type: "range" } });
  }

  setLimits(min: number, max: number, step: number | "any"): this {
    this.el.setAttribute("min", String(min));
    this.el.setAttribute("max", String(max));
    this.el.setAttribute("step", String(step));
    return this;
  }

  getValue(): number {
    return this.value;
  }

  setValue(value: number): this {
    this.value = value;
    this.el.value = String(value);
    return this;
  }

  setDynamicTooltip(): this {
    return this;
  }

  setDisabled(disabled: boolean): this {
    this.el.disabled = disabled;
    return this;
  }

  onChange(fn: (value: number) => void | Promise<void>): this {
    this.changeHandler = fn;
    return this;
  }

  async triggerChange(value: number): Promise<void> {
    this.value = value;
    this.el.value = String(value);
    await this.changeHandler?.(value);
  }
}

export class DropdownComponent {
  el: FakeElement;
  selectEl: FakeElement;
  value = "";
  private changeHandler?: (value: string) => void | Promise<void>;

  constructor(containerEl: FakeElement) {
    this.el = containerEl.createEl("select");
    this.selectEl = this.el;
  }

  addOption(value: string, display: string): this {
    this.selectEl.createEl("option", { attr: { value }, text: display });
    return this;
  }

  addOptions(options: Record<string, string>): this {
    for (const [value, display] of Object.entries(options)) this.addOption(value, display);
    return this;
  }

  getValue(): string {
    return this.value;
  }

  setValue(value: string): this {
    this.value = value;
    this.selectEl.value = value;
    return this;
  }

  setDisabled(disabled: boolean): this {
    this.selectEl.disabled = disabled;
    return this;
  }

  onChange(fn: (value: string) => void | Promise<void>): this {
    this.changeHandler = fn;
    return this;
  }

  async triggerChange(value: string): Promise<void> {
    this.value = value;
    this.selectEl.value = value;
    await this.changeHandler?.(value);
  }
}

