import type { FakeElement } from "../dom";

export class TextComponent {
  el: FakeElement;
  value = "";
  private changeHandler?: (value: string) => void | Promise<void>;

  constructor(containerEl: FakeElement) {
    this.el = containerEl.createEl("input");
  }

  get inputEl(): FakeElement {
    return this.el;
  }

  setPlaceholder(placeholder: string): this {
    this.el.setAttribute("placeholder", placeholder);
    return this;
  }

  setValue(value: string): this {
    this.value = value;
    this.el.value = value;
    return this;
  }

  onChange(fn: (value: string) => void | Promise<void>): this {
    this.changeHandler = fn;
    return this;
  }

  async triggerChange(value: string): Promise<void> {
    this.value = value;
    this.el.value = value;
    await this.changeHandler?.(value);
  }
}

export class ToggleComponent {
  el: FakeElement;
  value = false;
  private changeHandler?: (value: boolean) => void | Promise<void>;

  constructor(containerEl: FakeElement) {
    this.el = containerEl.createEl("input", { attr: { type: "checkbox" } });
  }

  setValue(value: boolean): this {
    this.value = value;
    return this;
  }

  onChange(fn: (value: boolean) => void | Promise<void>): this {
    this.changeHandler = fn;
    return this;
  }

  async triggerChange(value: boolean): Promise<void> {
    this.value = value;
    await this.changeHandler?.(value);
  }
}

export class ButtonComponent {
  el: FakeElement;
  private clickHandler?: (evt: unknown) => void | Promise<void>;
  private tooltip = "";
  private icon = "";
  private buttonText = "";
  private warning = false;

  constructor(containerEl: FakeElement) {
    this.el = containerEl.createEl("button");
  }

  get buttonEl(): FakeElement {
    return this.el;
  }

  setIcon(icon: string): this {
    this.icon = icon;
    this.el.setAttribute("data-icon", icon);
    return this;
  }

  getIcon(): string {
    return this.icon;
  }

  setTooltip(tooltip: string): this {
    this.tooltip = tooltip;
    this.el.setAttribute("aria-label", tooltip);
    return this;
  }

  getTooltip(): string {
    return this.tooltip;
  }

  setButtonText(text: string): this {
    this.buttonText = text;
    this.el.setText(text);
    return this;
  }

  getButtonText(): string {
    return this.buttonText;
  }

  setWarning(): this {
    this.warning = true;
    this.el.addClass("mod-warning");
    return this;
  }

  isWarning(): boolean {
    return this.warning;
  }

  setDisabled(disabled: boolean): this {
    this.el.disabled = disabled;
    return this;
  }

  onClick(fn: (evt: unknown) => void | Promise<void>): this {
    this.clickHandler = fn;
    this.el.addEventListener("click", (evt) => void this.clickHandler?.(evt));
    return this;
  }

  async triggerClick(): Promise<void> {
    await this.clickHandler?.({});
  }
}

