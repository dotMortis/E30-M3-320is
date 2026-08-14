import { makeEl, type FakeElement } from "../dom";
import { Component } from "./core";

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
