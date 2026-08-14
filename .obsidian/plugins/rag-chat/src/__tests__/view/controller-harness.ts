import { beforeEach, vi } from "vitest";
import type { Vault } from "obsidian";
import { fakeSettings } from "../fixtures/settings";
import { TORQUE_BLOCK } from "../fixtures/context-blocks";

export const answerQuestion = vi.fn();
export const continueAnswer = vi.fn();
vi.mock("../../workflow", () => ({ answerQuestion, continueAnswer }));

type Controller = typeof import("../../view/controller");
export let createChatSessionState: Controller["createChatSessionState"];
export let inputPlaceholder: Controller["inputPlaceholder"];
export let sendMessage: Controller["sendMessage"];
export let abandonPendingClarification: Controller["abandonPendingClarification"];
export let discardFailedTurn: Controller["discardFailedTurn"];
export let retryTurn: Controller["retryTurn"];

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import("../../view/controller");
  createChatSessionState = mod.createChatSessionState;
  inputPlaceholder = mod.inputPlaceholder;
  sendMessage = mod.sendMessage;
  abandonPendingClarification = mod.abandonPendingClarification;
  discardFailedTurn = mod.discardFailedTurn;
  retryTurn = mod.retryTurn;
});

export const baseDeps = {
  settings: fakeSettings(),
  vault: {} as unknown as Vault,
  getIndices: async () => ({ textDb: {}, vectorDbs: [], referenceChunks: new Map() }) as any,
  getFuzzyApi: () => null,
};

export const DONE_RESULT = {
  status: "done" as const,
  text: "Zylinderkopfschrauben: 30 Nm.",
  manualCitations: [TORQUE_BLOCK],
  webCitations: [],
  webGroundingChunks: [],
  webGroundingSupports: [],
};
