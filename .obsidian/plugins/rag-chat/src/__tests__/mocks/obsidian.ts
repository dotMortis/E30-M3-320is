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
  private domEventCleanups: (() => void)[] = [];
  private children: Component[] = [];
  private registeredCallbacks: (() => void)[] = [];

  load(): void {
    this.onload();
  }

  onload(): void {}

  unload(): void {
    for (const cleanup of this.domEventCleanups.splice(0)) cleanup();
    for (const cb of this.registeredCallbacks.splice(0)) cb();
    for (const child of this.children.splice(0)) child.unload();
    this.onunload();
  }

  onunload(): void {}

  addChild<T extends Component>(child: T): T {
    this.children.push(child);
    return child;
  }

  removeChild<T extends Component>(child: T): T {
    this.children = this.children.filter((c) => c !== child);
    return child;
  }

  register(cb: () => void): void {
    this.registeredCallbacks.push(cb);
  }

  registerEvent(_eventRef: unknown): void {}

  registerInterval(id: number): number {
    return id;
  }

  registerDomEvent(el: FakeElement, type: string, callback: (evt: unknown) => void): void {
    el.addEventListener(type, callback);
    this.domEventCleanups.push(() => el.removeEventListener(type, callback));
  }
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

export class Modal {
  static instances: Modal[] = [];
  app: unknown;
  containerEl: FakeElement;
  modalEl: FakeElement;
  titleEl: FakeElement;
  contentEl: FakeElement;

  constructor(app: unknown) {
    this.app = app;
    this.containerEl = makeEl("div");
    this.modalEl = this.containerEl.createDiv();
    this.titleEl = this.modalEl.createDiv();
    this.contentEl = this.modalEl.createDiv();
    Modal.instances.push(this);
  }

  open(): void {
    void this.onOpen();
  }

  close(): void {
    this.onClose();
  }

  onOpen(): void | Promise<void> {}

  onClose(): void {}

  setTitle(title: string): this {
    this.titleEl.setText(title);
    return this;
  }

  setContent(content: string): this {
    this.contentEl.setText(content);
    return this;
  }
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

  constructor(containerEl: FakeElement) {
    this.el = containerEl.createEl("button");
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

  onClick(fn: (evt: unknown) => void | Promise<void>): this {
    this.clickHandler = fn;
    this.el.addEventListener("click", (evt) => void this.clickHandler?.(evt));
    return this;
  }

  async triggerClick(): Promise<void> {
    await this.clickHandler?.({});
  }
}

export class Setting {
  static instances: Setting[] = [];
  containerEl: FakeElement;
  settingEl: FakeElement;
  components: (TextComponent | ToggleComponent | ButtonComponent)[] = [];

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
  Modal.instances = [];
  requestUrl.mockReset();
}
