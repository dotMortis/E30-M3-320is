import type { FakeElement } from "../dom";

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

