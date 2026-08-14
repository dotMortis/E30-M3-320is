import { describe, expect, it, vi } from "vitest";
import { Component, type App } from "obsidian";
import { makeEl } from "../mocks/dom";
import { createFakeWorkspace } from "../mocks/fake-app";
import { renderManualCitations, renderWebCitations } from "../../view/render-citations";
import { REFERENCE_BLOCK, TORQUE_BLOCK } from "../fixtures/context-blocks";
import type { ChatTurn } from "../../retrieval/types";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

function makeApp() {
  const workspace = createFakeWorkspace();
  return { app: { workspace } as unknown as App, workspace };
}

describe("renderManualCitations", () => {
  it("renders nothing when the turn has no citations", () => {
    const turnEl = makeEl("div");
    const { app } = makeApp();
    renderManualCitations(turnEl as unknown as HTMLElement, { role: "assistant", text: "x" }, app, new Component());
    expect(turnEl.children).toHaveLength(0);
  });

  it("labels a page citation as 'seitencode (sektion)'", () => {
    const turnEl = makeEl("div");
    const { app } = makeApp();
    const turn: ChatTurn = { role: "assistant", text: "x", citations: [TORQUE_BLOCK] };
    renderManualCitations(turnEl as unknown as HTMLElement, turn, app, new Component());
    const link = turnEl.children[0].children.find((c) => c.tag === "a")!;
    expect(link.text).toBe(`${TORQUE_BLOCK.seitencode} (${TORQUE_BLOCK.sektion})`);
  });

  it("labels a reference-doc citation (no seitencode) as 'titel (sektion)'", () => {
    const turnEl = makeEl("div");
    const { app } = makeApp();
    const turn: ChatTurn = { role: "assistant", text: "x", citations: [REFERENCE_BLOCK] };
    renderManualCitations(turnEl as unknown as HTMLElement, turn, app, new Component());
    const link = turnEl.children[0].children.find((c) => c.tag === "a")!;
    expect(link.text).toBe(`${REFERENCE_BLOCK.titel} (${REFERENCE_BLOCK.sektion})`);
  });

  it("opens the citation's notePath via workspace.openLinkText on click", () => {
    const turnEl = makeEl("div");
    const { app, workspace } = makeApp();
    const turn: ChatTurn = { role: "assistant", text: "x", citations: [TORQUE_BLOCK] };
    renderManualCitations(turnEl as unknown as HTMLElement, turn, app, new Component());
    const link = turnEl.children[0].children.find((c) => c.tag === "a")!;
    link.dispatch("click", { preventDefault: vi.fn() });
    expect(workspace.openLinkTextCalls).toEqual([{ linktext: TORQUE_BLOCK.notePath, sourcePath: "", newLeaf: false }]);
  });

  it("renders one link per citation, in order", () => {
    const turnEl = makeEl("div");
    const { app } = makeApp();
    const turn: ChatTurn = { role: "assistant", text: "x", citations: [TORQUE_BLOCK, REFERENCE_BLOCK] };
    renderManualCitations(turnEl as unknown as HTMLElement, turn, app, new Component());
    const links = turnEl.children[0].children.filter((c) => c.tag === "a");
    expect(links).toHaveLength(2);
  });

  it("registers the click listener via the component so it's removed when the component unloads", () => {
    const turnEl = makeEl("div");
    const { app, workspace } = makeApp();
    const turn: ChatTurn = { role: "assistant", text: "x", citations: [TORQUE_BLOCK] };
    const component = new Component();
    renderManualCitations(turnEl as unknown as HTMLElement, turn, app, component);
    component.unload();
    const link = turnEl.children[0].children.find((c) => c.tag === "a")!;
    link.dispatch("click", { preventDefault: vi.fn() });
    expect(workspace.openLinkTextCalls).toEqual([]);
  });
});

describe("renderWebCitations", () => {
  it("renders nothing when the turn has no web citations", () => {
    const turnEl = makeEl("div");
    renderWebCitations(turnEl as unknown as HTMLElement, { role: "assistant", text: "x" });
    expect(turnEl.children).toHaveLength(0);
  });

  it("renders a link with title text and href for each web citation", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = {
      role: "assistant",
      text: "x",
      webCitations: [{ uri: "https://example.com", title: "Example Site" }],
    };
    renderWebCitations(turnEl as unknown as HTMLElement, turn);
    const link = turnEl.querySelectorAll("a")[0];
    expect(link.text).toBe("Example Site");
    expect(link.attrs.href).toBe("https://example.com");
  });

  it("falls back to the URI as link text when title is empty", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "x", webCitations: [{ uri: "https://example.com", title: "" }] };
    renderWebCitations(turnEl as unknown as HTMLElement, turn);
    const link = turnEl.querySelectorAll("a")[0];
    expect(link.text).toBe("https://example.com");
  });

  it("appends the cited excerpt snippet when one exists for that uri", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = {
      role: "assistant",
      text: "x",
      webCitations: [{ uri: "https://example.com", title: "Example" }],
      webGroundingChunks: [{ uri: "https://example.com", title: "Example" }],
      webGroundingSupports: [{ startIndex: 0, endIndex: 5, chunkIndices: [0], text: "cited excerpt" }],
    };
    renderWebCitations(turnEl as unknown as HTMLElement, turn);
    const row = turnEl.children[0].children.find((c) => c.tag === "span" && c.classes.has("rag-chat-web-citation-row"))!;
    const snippetEl = row.children.find((c) => c.classes.has("rag-chat-web-citation-snippet"));
    expect(snippetEl?.text).toContain("cited excerpt");
  });

  it("omits the snippet span when no excerpt is available for that uri", () => {
    const turnEl = makeEl("div");
    const turn: ChatTurn = { role: "assistant", text: "x", webCitations: [{ uri: "https://example.com", title: "Example" }] };
    renderWebCitations(turnEl as unknown as HTMLElement, turn);
    const row = turnEl.children[0].children.find((c) => c.tag === "span" && c.classes.has("rag-chat-web-citation-row"))!;
    const snippetEl = row.children.find((c) => c.classes.has("rag-chat-web-citation-snippet"));
    expect(snippetEl).toBeUndefined();
  });
});
