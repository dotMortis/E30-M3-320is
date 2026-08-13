/**
 * @param {string} tag
 * @returns {object} a minimal fake DOM element
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
    addClass(cls) {
      this.classes.add(cls);
      return this;
    },
    removeClass(cls) {
      this.classes.delete(cls);
      return this;
    },
    empty() {
      this.children = [];
      return this;
    },
    setText(text) {
      this.text = text;
      return this;
    },
    appendText(text) {
      this.text += text;
      return this;
    },
    scrollIntoView() {},
    focus() {},
    addEventListener(type, fn) {
      (this.listeners[type] = this.listeners[type] || []).push(fn);
    },
    removeEventListener(type, fn) {
      this.listeners[type] = (this.listeners[type] || []).filter((listener) => listener !== fn);
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

/**
 * @param {object} el
 * @param {string} text
 */
export function renderMatches(el, text) {
  el.setText(text);
}
