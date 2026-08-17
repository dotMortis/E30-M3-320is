import { makeEl, type FakeElement } from "./dom";
import { Notice } from "./obsidian/core";
import { Modal } from "./obsidian/plugin";
import { Setting } from "./obsidian/components";
import { Platform, requestUrl, setIcon } from "./obsidian/platform";

export { makeEl, type FakeElement };
export { Component, Notice } from "./obsidian/core";
export { ItemView, Modal, Plugin, PluginSettingTab } from "./obsidian/plugin";
export {
  ButtonComponent,
  DropdownComponent,
  Setting,
  SliderComponent,
  TextComponent,
  ToggleComponent,
} from "./obsidian/components";
export { FileSystemAdapter, Keymap, MarkdownRenderer, Platform, requestUrl, setIcon } from "./obsidian/platform";

export function resetObsidianMocks(): void {
  Notice.instances = [];
  Setting.instances = [];
  Modal.instances = [];
  requestUrl.mockReset();
  setIcon.mockClear();
  Platform.isDesktopApp = true;
}
