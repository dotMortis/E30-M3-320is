import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetObsidianMocks, Notice } from "../mocks/obsidian";
import type { FakeElement } from "../mocks/dom";
import { createFakeApp } from "../mocks/fake-app";
import { fakeManifest } from "../fixtures/manifest";
import { fakeSettings } from "../fixtures/settings";

function fake(el: HTMLElement): FakeElement {
  return el as unknown as FakeElement;
}

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

const getIndices = vi.fn();
vi.mock("../../retrieval/index-cache", () => ({ getIndices }));

const answerQuestion = vi.fn();
const continueAnswer = vi.fn();
vi.mock("../../workflow", () => ({ answerQuestion, continueAnswer }));

let RagChatView: typeof import("../../view/view").RagChatView;
let RAG_CHAT_VIEW_TYPE: typeof import("../../view/view").RAG_CHAT_VIEW_TYPE;

beforeEach(async () => {
  resetObsidianMocks();
  vi.clearAllMocks();
  ({ RagChatView, RAG_CHAT_VIEW_TYPE } = await import("../../view/view"));
});

const DONE_RESULT = {
  status: "done" as const,
  text: "Zylinderkopfschrauben: 30 Nm. [Seite 11-09]",
  manualCitations: [],
  webCitations: [],
  webGroundingChunks: [],
  webGroundingSupports: [],
};

function makeView() {
  const app = createFakeApp();
  const plugin = {
    settings: fakeSettings(),
    getManifest: vi.fn().mockResolvedValue(fakeManifest()),
    getPluginDirFullPath: vi.fn().mockReturnValue("/plugin/dir"),
  };
  const leaf = { app };
  const view = new RagChatView(leaf as any, plugin as any);
  return { view, app, plugin };
}

describe("RagChatView", () => {
  it("reports its view type, display text, and icon", () => {
    const { view } = makeView();
    expect(view.getViewType()).toBe(RAG_CHAT_VIEW_TYPE);
    expect(view.getDisplayText()).toBe("RAG Chat");
    expect(view.getIcon()).toBe("message-circle-question");
  });

  it("builds the input row and message list on open", async () => {
    const { view } = makeView();
    await view.onOpen();
    expect(fake(view.contentEl).classes.has("rag-chat-container")).toBe(true);
    expect(fake(view.contentEl).querySelectorAll(".rag-chat-messages")).toHaveLength(1);
    expect(fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")).toHaveLength(1);
    expect(fake(view.contentEl).querySelectorAll("button.rag-chat-send")).toHaveLength(1);
  });

  it("sends a message on send-button click and renders the assistant's answer", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    answerQuestion.mockResolvedValue(DONE_RESULT);
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Wie viel Nm für die Zylinderkopfschrauben?";
    button.dispatch("click");

    await vi.waitFor(() => {
      const assistantText = fake(view.contentEl).querySelectorAll(".rag-chat-turn-text")[1];
      expect(assistantText?.text).toContain("30 Nm");
    });
  });

  it("sends a message on Enter (without Shift) in the textarea", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    answerQuestion.mockResolvedValue(DONE_RESULT);
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    input.value = "Frage?";
    const preventDefault = vi.fn();
    input.dispatch("keydown", { key: "Enter", shiftKey: false, preventDefault });

    await vi.waitFor(() => {
      expect(answerQuestion).toHaveBeenCalled();
    });
    expect(preventDefault).toHaveBeenCalled();
  });

  it("does not send on Shift+Enter (allows multi-line input)", async () => {
    const { view } = makeView();
    await view.onOpen();
    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    input.value = "Frage?";
    input.dispatch("keydown", { key: "Enter", shiftKey: true, preventDefault: vi.fn() });
    expect(answerQuestion).not.toHaveBeenCalled();
  });

  it("does nothing when the input is empty", async () => {
    const { view } = makeView();
    await view.onOpen();
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    button.dispatch("click");
    expect(answerQuestion).not.toHaveBeenCalled();
  });

  it("disables the send button while a request is in flight and re-enables it after", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    let resolveAnswer!: (v: typeof DONE_RESULT) => void;
    answerQuestion.mockReturnValue(new Promise((resolve) => (resolveAnswer = resolve)));
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Frage?";
    button.dispatch("click");

    await vi.waitFor(() => expect(button.disabled).toBe(true));

    resolveAnswer(DONE_RESULT);
    await vi.waitFor(() => expect(button.disabled).toBe(false));
  });

  it("shows a Notice and an error turn when the workflow throws", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    answerQuestion.mockRejectedValue(new Error("Google API key is required"));
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Frage?";
    button.dispatch("click");

    await vi.waitFor(() => {
      expect(Notice.instances.length).toBeGreaterThan(0);
    });
    expect(Notice.instances[0].message).toContain("Google API key is required");

    const assistantText = fake(view.contentEl).querySelectorAll(".rag-chat-turn-text")[1];
    expect(assistantText.text).toContain("Fehler:");
  });

  it("clears the input textarea immediately after sending", async () => {
    getIndices.mockResolvedValue({ textDb: {}, vectorDbs: [], referenceChunks: new Map() });
    answerQuestion.mockResolvedValue(DONE_RESULT);
    const { view } = makeView();
    await view.onOpen();

    const input = fake(view.contentEl).querySelectorAll("textarea.rag-chat-input")[0];
    const button = fake(view.contentEl).querySelectorAll("button.rag-chat-send")[0];
    input.value = "Frage?";
    button.dispatch("click");

    expect(input.value).toBe("");
  });

  it("empties the content element on close", async () => {
    const { view } = makeView();
    await view.onOpen();
    await view.onClose();
    expect(fake(view.contentEl).children).toHaveLength(0);
  });
});
