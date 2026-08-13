import { FileSystemAdapter } from "./obsidian";

export interface FakeLeaf {
  viewType: string | null;
  view: { app?: unknown };
  setViewState(state: { type: string; active?: boolean }): Promise<void>;
}

export function createFakeWorkspace() {
  const leaves: FakeLeaf[] = [];
  const openLinkTextCalls: { linktext: string; sourcePath: string; newLeaf: boolean }[] = [];
  const triggerCalls: { event: string; payload: unknown }[] = [];
  const revealedLeaves: FakeLeaf[] = [];

  function makeLeaf(): FakeLeaf {
    const leaf: FakeLeaf = {
      viewType: null,
      view: {},
      async setViewState(state) {
        leaf.viewType = state.type;
      },
    };
    return leaf;
  }

  return {
    leaves,
    openLinkTextCalls,
    triggerCalls,
    revealedLeaves,
    getLeavesOfType(viewType: string): FakeLeaf[] {
      return leaves.filter((l) => l.viewType === viewType);
    },
    getRightLeaf(_split: boolean): FakeLeaf {
      const leaf = makeLeaf();
      leaves.push(leaf);
      return leaf;
    },
    getLeaf(_newLeaf: boolean): FakeLeaf {
      const leaf = makeLeaf();
      leaves.push(leaf);
      return leaf;
    },
    revealLeaf(leaf: FakeLeaf): void {
      revealedLeaves.push(leaf);
    },
    async openLinkText(linktext: string, sourcePath: string, newLeaf = false): Promise<void> {
      openLinkTextCalls.push({ linktext, sourcePath, newLeaf });
    },
    trigger(event: string, payload: unknown): void {
      triggerCalls.push({ event, payload });
    },
  };
}

export class FakeFileSystemAdapter extends FileSystemAdapter {
  private files: Map<string, string>;
  constructor(files: Record<string, string> = {}, basePath = "/fake-vault") {
    super(basePath);
    this.files = new Map(Object.entries(files));
  }
  async read(path: string): Promise<string> {
    const found = this.files.get(path);
    if (found === undefined) throw new Error(`FakeFileSystemAdapter: no file registered for "${path}"`);
    return found;
  }
}

export function createFakeApp(opts: { adapterFiles?: Record<string, string>; vault?: unknown } = {}) {
  const workspace = createFakeWorkspace();
  const adapter = new FakeFileSystemAdapter(opts.adapterFiles ?? {});
  const vault = { adapter, ...(opts.vault as Record<string, unknown> | undefined) };
  const app = { workspace, vault, plugins: { plugins: {} as Record<string, { api?: unknown }> } };
  return app;
}
