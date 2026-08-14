import { vi } from "vitest";
import type { FakeElement } from "../dom";

export const setIcon = vi.fn((el: FakeElement, icon: string): void => {
  el.setAttribute("data-icon", icon);
});

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
    _component: unknown,
  ): Promise<void> {
    el.setText(markdown);
  },
};

export const requestUrl = vi.fn(async (_params: unknown): Promise<unknown> => {
  throw new Error("requestUrl mock: not stubbed for this test - see mocks/gemini-http.ts");
});
