import { beforeEach, vi } from "vitest";
import type { App } from "obsidian";
import { createFakeWorkspace } from "../mocks/fake-app";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

type RenderTurns = typeof import("../../view/render-turns");
export let renderTurns: RenderTurns["renderTurns"];
export let appendNewTurns: RenderTurns["appendNewTurns"];
export let updateTurn: RenderTurns["updateTurn"];
export let updateTurnLive: RenderTurns["updateTurnLive"];
export let unloadAllTurns: RenderTurns["unloadAllTurns"];

beforeEach(async () => {
  const mod = await import("../../view/render-turns");
  renderTurns = mod.renderTurns;
  appendNewTurns = mod.appendNewTurns;
  updateTurn = mod.updateTurn;
  updateTurnLive = mod.updateTurnLive;
  unloadAllTurns = mod.unloadAllTurns;
});

export function makeApp(): App {
  const workspace = createFakeWorkspace();
  return { workspace } as unknown as App;
}
