import { vi } from "vitest";
import { makeEl, type FakeElement } from "./dom";

export { makeEl, type FakeElement };

export class Notice {
  static instances: Notice[] = [];
  message: string;
  timeout?: number;
  constructor(message: string, timeout?: number) {
    this.message = message;
    this.timeout = timeout;
    Notice.instances.push(this);
  }
  hide(): void {}
}

export class Component {
  load(): void {}
  unload(): void {}
}

export class Plugin {
  app: unknown;
  manifest: { id: string; dir?: string };
  ribbonIcons: { icon: string; title: string; cb: () => void }[] = [];
  commands: { id: string; name: string; callback: () => void }[] = [];
  settingTabs: unknown[] = [];
  viewFactories = new Map<string, (leaf: unknown) => unknown>();

  constructor(app: unknown, manifest: { id: string; dir?: string }) {
    this.app = app;
    this.manifest = manifest;
  }

  registerView(viewType: string, factory: (leaf: unknown) => unknown): void {
    this.viewFactories.set(viewType, factory);
  }

  addRibbonIcon(icon: string, title: string, cb: () => void): FakeElement {
    this.ribbonIcons.push({ icon, title, cb });
    return makeEl("div");
  }

  addCommand(command: { id: string; name: string; callback: () => void }): void {
    this.commands.push(command);
  }

  addSettingTab(tab: unknown): void {
    this.settingTabs.push(tab);
  }

  async loadData(): Promise<unknown> {
    return undefined;
  }

  async saveData(_data: unknown): Promise<void> {}

  onload(): void {}

  onunload(): void {}
}

export class ItemView extends Component {
  app: unknown;
  leaf: unknown;
  containerEl: FakeElement;
  contentEl: FakeElement;

  constructor(leaf: unknown) {
    super();
    this.leaf = leaf;
    this.app = (leaf as { app?: unknown })?.app;
    this.containerEl = makeEl("div");
    this.contentEl = this.containerEl.createDiv();
  }

  getViewType(): string {
    return "item-view-mock";
  }

  getDisplayText(): string {
    return "";
  }

  getIcon(): string {
    return "";
  }

  async onOpen(): Promise<void> {}

  async onClose(): Promise<void> {}
}

export class PluginSettingTab {
  app: unknown;
  plugin: unknown;
  containerEl: FakeElement;

  constructor(app: unknown, plugin: unknown) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = makeEl("div");
  }

  display(): void {}
  hide(): void {}
}

export class TextComponent {
  el: FakeElement;
  value = "";
  private changeHandler?: (value: string) => void | Promise<void>;

  constructor(containerEl: FakeElement) {
    this.el = containerEl.createEl("input");
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

export class Setting {
  static instances: Setting[] = [];
  containerEl: FakeElement;
  settingEl: FakeElement;
  components: (TextComponent | ToggleComponent)[] = [];

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
}

export class FileSystemAdapter {
  basePath: string;
  constructor(basePath = "/fake-vault") {
    this.basePath = basePath;
  }
  getFullPath(relPath: string): string {
    return `${this.basePath}/${relPath}`;
  }
  async read(_path: string): Promise<string> {
    throw new Error("FileSystemAdapter mock: read() not stubbed for this test");
  }
}

export const Keymap = {
  isModEvent(evt: unknown): boolean {
    const e = evt as { ctrlKey?: boolean; metaKey?: boolean } | undefined;
    return Boolean(e?.ctrlKey || e?.metaKey);
  },
};

export const MarkdownRenderer = {
  async render(
    _app: unknown,
    markdown: string,
    el: FakeElement,
    _sourcePath: string,
    _component: unknown
  ): Promise<void> {
    el.setText(markdown);
  },
};

export const requestUrl = vi.fn(async (_params: unknown): Promise<unknown> => {
  throw new Error("requestUrl mock: not stubbed for this test - see mocks/gemini-http.ts");
});

export function resetObsidianMocks(): void {
  Notice.instances = [];
  Setting.instances = [];
  requestUrl.mockReset();
}
