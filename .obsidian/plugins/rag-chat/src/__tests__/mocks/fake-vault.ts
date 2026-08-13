export interface FakeNote {
  notePath: string;
  content: string;
}

export interface FakeVaultFile {
  path: string;
}

export function createFakeVault(notes: FakeNote[]) {
  const files = new Map<string, FakeVaultFile>(notes.map((n) => [n.notePath, { path: n.notePath }]));
  const contentByPath = new Map(notes.map((n) => [n.notePath, n.content]));

  return {
    getFileByPath(path: string): FakeVaultFile | null {
      return files.get(path) ?? null;
    },
    async read(file: FakeVaultFile): Promise<string> {
      return contentByPath.get(file.path) ?? "";
    },
  };
}
