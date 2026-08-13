/**
 * mocks/obsidian.js — minimal hand-rolled stand-in for the `obsidian`
 * module, covering only the primitives main.js actually uses (Plugin,
 * Modal, Component, MarkdownRenderer, Notice, renderMatches). Deliberately
 * NOT the real `obsidian` package + jsdom (per the agreed test scope) -
 * this is just enough fake DOM/API surface for VaultSearchModal's
 * onOpen()/_onQueryChanged()/_renderList() to run without throwing, so the
 * debounce/cancellation smoke test can drive it end-to-end.
 */

export function makeEl(tag) {
  const el = {
    tag,
    children: [],
    classes: new Set(),
    text: "",
    value: "",
    attrs: {},
    listeners: {},
    createDiv(opts = {}) {
      const child = makeEl("div");
      if (opts.cls) child.addClass(opts.cls);
      if (opts.text !== undefined) child.setText(opts.text);
      this.children.push(child);
      return child;
    },
    createEl(tagName, opts = {}) {
      const child = makeEl(tagName);
      if (opts.cls) child.addClass(opts.cls);
      if (opts.attr) Object.assign(child.attrs, opts.attr);
      if (opts.text !== undefined) child.setText(opts.text);
      this.children.push(child);
      return child;
    },
    addClass(c) {
      this.classes.add(c);
      return this;
    },
    removeClass(c) {
      this.classes.delete(c);
      return this;
    },
    empty() {
      this.children = [];
      return this;
    },
    setText(t) {
      this.text = t;
      return this;
    },
    appendText(t) {
      this.text += t;
      return this;
    },
    scrollIntoView() {},
    focus() {},
    addEventListener(type, fn) {
      (this.listeners[type] = this.listeners[type] || []).push(fn);
    },
    removeEventListener(type, fn) {
      this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== fn);
    },
    dispatch(type, evt = {}) {
      for (const fn of [...(this.listeners[type] || [])]) fn(evt);
    },
  };
  return el;
}

export class Component {
  load() {}
  unload() {}
}

export class Modal {
  constructor(app) {
    this.app = app;
    this.modalEl = makeEl("div");
    this.contentEl = makeEl("div");
    this.scope = { register: () => {} };
  }
  open() {
    this.onOpen?.();
  }
  close() {
    this.onClose?.();
  }
}

export class Plugin {
  constructor(app, manifest) {
    this.app = app;
    this.manifest = manifest;
  }
  addCommand() {}
  onload() {}
}

export class Notice {
  constructor(message, timeout) {
    this.message = message;
    this.timeout = timeout;
  }
  hide() {}
}

export const MarkdownRenderer = {
  render: async () => {},
};

/** Real renderMatches highlights sub-ranges; the mock just needs to render
 * the plain text so tests can assert on final displayed content. */
export function renderMatches(el, text) {
  el.setText(text);
}
