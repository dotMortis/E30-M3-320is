import type { FakeElement } from "../dom";
import { ButtonComponent, TextComponent, ToggleComponent } from "./inputs";
import { DropdownComponent, SliderComponent } from "./selects";

export { ButtonComponent, TextComponent, ToggleComponent } from "./inputs";
export { DropdownComponent, SliderComponent } from "./selects";

export class Setting {
  static instances: Setting[] = [];
  containerEl: FakeElement;
  settingEl: FakeElement;
  components: (TextComponent | ToggleComponent | ButtonComponent | DropdownComponent | SliderComponent)[] = [];

  constructor(containerEl: FakeElement) {
    this.containerEl = containerEl;
    this.settingEl = containerEl.createDiv({ cls: "setting-item" });
    Setting.instances.push(this);
  }

  setName(name: string): this {
    this.settingEl.createDiv({ cls: "setting-item-name", text: name });
    return this;
  }

  setDesc(desc: string): this {
    this.settingEl.createDiv({ cls: "setting-item-description", text: desc });
    return this;
  }

  addText(cb: (text: TextComponent) => void): this {
    const component = new TextComponent(this.settingEl);
    this.components.push(component);
    cb(component);
    return this;
  }

  addToggle(cb: (toggle: ToggleComponent) => void): this {
    const component = new ToggleComponent(this.settingEl);
    this.components.push(component);
    cb(component);
    return this;
  }

  addButton(cb: (button: ButtonComponent) => void): this {
    const component = new ButtonComponent(this.settingEl);
    this.components.push(component);
    cb(component);
    return this;
  }

  addDropdown(cb: (dropdown: DropdownComponent) => void): this {
    const component = new DropdownComponent(this.settingEl);
    this.components.push(component);
    cb(component);
    return this;
  }

  addSlider(cb: (slider: SliderComponent) => void): this {
    const component = new SliderComponent(this.settingEl);
    this.components.push(component);
    cb(component);
    return this;
  }
}
