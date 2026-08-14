export interface FakeElement {
  tag: string;
  children: FakeElement[];
  parent: FakeElement | null;
  classes: Set<string>;
  text: string;
  value: string;
  type: string;
  disabled: boolean;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  attrs: Record<string, string>;
  listeners: Record<string, ((evt: unknown) => void)[]>;
  classList: {
    add(cls: string): void;
    remove(cls: string): void;
    contains(cls: string): boolean;
  };
  createDiv(opts?: { cls?: string | string[]; text?: string }): FakeElement;
  createSpan(opts?: { cls?: string | string[]; text?: string }): FakeElement;
  createEl(
    tagName: string,
    opts?: { cls?: string | string[]; text?: string; attr?: Record<string, string> },
  ): FakeElement;
  addClass(cls: string): FakeElement;
  removeClass(cls: string): FakeElement;
  toggleClass(classes: string | string[], value: boolean): void;
  empty(): FakeElement;
  setText(text: string): FakeElement;
  appendText(text: string): FakeElement;
  setPlaceholder?(text: string): FakeElement;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  scrollIntoView(): void;
  focus(): void;
  scrollTo(opts: { top: number }): void;
  addEventListener(type: string, fn: (evt: unknown) => void): void;
  removeEventListener(type: string, fn: (evt: unknown) => void): void;
  dispatch(type: string, evt?: unknown): void;
  querySelectorAll(selector: string): FakeElement[];
  querySelector(selector: string): FakeElement | null;
}
