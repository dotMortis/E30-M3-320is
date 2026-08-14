import { beforeEach, vi } from "vitest";
import { resetObsidianMocks } from "./mocks/obsidian";
import { createFakeApp } from "./mocks/fake-app";

vi.mock("obsidian", async () => {
  const mock = await import("./mocks/obsidian");
  return mock;
});

export let RagChatPlugin: typeof import("../main").default;

beforeEach(async () => {
  resetObsidianMocks();
  RagChatPlugin = (await import("../main")).default;
});

export function makePlugin(opts: { adapterFiles?: Record<string, string>; loadData?: unknown } = {}) {
  const app = createFakeApp({ adapterFiles: opts.adapterFiles });
  const plugin = new RagChatPlugin(app as any, { id: "rag-chat", dir: ".obsidian/plugins/rag-chat" } as any);
  plugin.loadData = vi.fn().mockResolvedValue(opts.loadData ?? {});
  plugin.saveData = vi.fn().mockResolvedValue(undefined);
  return { plugin, app };
}
