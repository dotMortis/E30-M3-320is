import type { FakeElement } from "./dom-types";

export type { FakeElement } from "./dom-types";

function matchesSelector(el: FakeElement, tag: string, cls: string | null): boolean {
  if (tag !== "*" && el.tag !== tag) return false;
  if (cls && !el.classes.has(cls)) return false;
  return true;
}

function collectMatches(el: FakeElement, tag: string, cls: string | null, out: FakeElement[]): void {
  for (const child of el.children) {
    if (matchesSelector(child, tag, cls)) out.push(child);
    collectMatches(child, tag, cls, out);
  }
}

function parseSimpleSelector(selector: string): { tag: string; cls: string | null } {
  const [tag, cls] = selector.split(".");
  return { tag: tag || "*", cls: cls ?? null };
}

export function makeEl(tag: string, parent: FakeElement | null = null): FakeElement {
  const el: FakeElement = {
    tag,
    children: [],
    parent,
    classes: new Set(),
    text: "",
    value: "",
    type: "text",
    disabled: false,
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    attrs: {},
    listeners: {},
    classList: {
      add(cls) {
        el.classes.add(cls);
      },
      remove(cls) {
        el.classes.delete(cls);
      },
      contains(cls) {
        return el.classes.has(cls);
      },
    },
    createDiv(opts = {}) {
      return el.createEl("div", opts);
    },
    createSpan(opts = {}) {
      return el.createEl("span", opts);
    },
    createEl(tagName, opts = {}) {
      const child = makeEl(tagName, el);
      const classes = opts.cls;
      if (classes) {
        const list = Array.isArray(classes) ? classes : classes.split(/\s+/).filter(Boolean);
        for (const c of list) child.addClass(c);
      }
      if (opts.attr) Object.assign(child.attrs, opts.attr);
      if (opts.text !== undefined) child.setText(opts.text);
      el.children.push(child);
      return child;
    },
    addClass(cls) {
      el.classes.add(cls);
      return el;
    },
    removeClass(cls) {
      el.classes.delete(cls);
      return el;
    },
    toggleClass(classes, value) {
      const list = Array.isArray(classes) ? classes : [classes];
      for (const c of list) {
        if (value) el.classes.add(c);
        else el.classes.delete(c);
      }
    },
    empty() {
      el.children = [];
      return el;
    },
    setText(text) {
      el.text = text;
      return el;
    },
    appendText(text) {
      el.text += text;
      return el;
    },
    getAttribute(name) {
      return name in el.attrs ? el.attrs[name] : null;
    },
    setAttribute(name, value) {
      el.attrs[name] = value;
    },
    scrollIntoView() {},
    focus() {},
    scrollTo(opts) {
      if (typeof opts?.top === "number") el.scrollTop = opts.top;
    },
    addEventListener(type, fn) {
      (el.listeners[type] ??= []).push(fn);
    },
    removeEventListener(type, fn) {
      el.listeners[type] = (el.listeners[type] ?? []).filter((listener) => listener !== fn);
    },
    dispatch(type, evt = {}) {
      for (const fn of [...(el.listeners[type] ?? [])]) fn(evt);
    },
    querySelectorAll(selector) {
      const { tag: selTag, cls } = parseSimpleSelector(selector);
      const out: FakeElement[] = [];
      collectMatches(el, selTag, cls, out);
      return out;
    },
    querySelector(selector) {
      return el.querySelectorAll(selector)[0] ?? null;
    },
  };
  return el;
}
