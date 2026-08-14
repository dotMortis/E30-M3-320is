import { beforeEach, describe, expect, it, vi } from "vitest";
import { Component, type App } from "obsidian";
import { makeEl, type FakeElement } from "../mocks/dom";
import { createFakeWorkspace } from "../mocks/fake-app";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let wireInternalLinks: typeof import("../../view/wire-links").wireInternalLinks;

beforeEach(async () => {
  ({ wireInternalLinks } = await import("../../view/wire-links"));
});

function makeApp() {
  const workspace = createFakeWorkspace();
  return { app: { workspace } as unknown as App, workspace };
}

describe("wireInternalLinks", () => {
  it("opens the link via workspace.openLinkText on click, preventing default", () => {
    const container = makeEl("div");
    const anchor = container.createEl("a", { cls: "internal-link", attr: { href: "16-01.md" } });
    const { app, workspace } = makeApp();

    wireInternalLinks(container as unknown as HTMLElement, app, new Component());

    const preventDefault = vi.fn();
    anchor.dispatch("click", { preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(workspace.openLinkTextCalls).toEqual([{ linktext: "16-01.md", sourcePath: "", newLeaf: false }]);
  });

  it("passes Keymap.isModEvent(evt) as the newLeaf argument to openLinkText", () => {
    const container = makeEl("div");
    const anchor = container.createEl("a", { cls: "internal-link", attr: { href: "16-01.md" } });
    const { app, workspace } = makeApp();

    wireInternalLinks(container as unknown as HTMLElement, app, new Component());
    anchor.dispatch("click", { preventDefault: vi.fn(), ctrlKey: true });

    expect(workspace.openLinkTextCalls[0].newLeaf).toBe(true);
  });

  it("does nothing on click when the anchor has no href", () => {
    const container = makeEl("div");
    const anchor = container.createEl("a", { cls: "internal-link" });
    const { app, workspace } = makeApp();

    wireInternalLinks(container as unknown as HTMLElement, app, new Component());
    anchor.dispatch("click", { preventDefault: vi.fn() });

    expect(workspace.openLinkTextCalls).toEqual([]);
  });

  it("triggers a 'hover-link' workspace event on mouseover", () => {
    const container = makeEl("div");
    const anchor = container.createEl("a", { cls: "internal-link", attr: { href: "16-01.md" } });
    const { app, workspace } = makeApp();

    wireInternalLinks(container as unknown as HTMLElement, app, new Component());
    anchor.dispatch("mouseover", { type: "mouseover" });

    expect(workspace.triggerCalls).toHaveLength(1);
    expect(workspace.triggerCalls[0].event).toBe("hover-link");
    expect(workspace.triggerCalls[0].payload).toMatchObject({ linktext: "16-01.md", sourcePath: "", source: "preview" });
  });

  it("does not trigger hover-link when the anchor has no href", () => {
    const container = makeEl("div");
    const anchor = container.createEl("a", { cls: "internal-link" });
    const { app, workspace } = makeApp();

    wireInternalLinks(container as unknown as HTMLElement, app, new Component());
    anchor.dispatch("mouseover", {});

    expect(workspace.triggerCalls).toEqual([]);
  });

  it("wires every matching anchor when there are multiple internal links", () => {
    const container = makeEl("div");
    container.createEl("a", { cls: "internal-link", attr: { href: "a.md" } });
    container.createEl("a", { cls: "internal-link", attr: { href: "b.md" } });
    const { app, workspace } = makeApp();

    wireInternalLinks(container as unknown as HTMLElement, app, new Component());
    for (const anchor of container.querySelectorAll("a.internal-link")) {
      (anchor as FakeElement).dispatch("click", { preventDefault: vi.fn() });
    }

    expect(workspace.openLinkTextCalls.map((c) => c.linktext).sort()).toEqual(["a.md", "b.md"]);
  });

  it("ignores anchors that don't have the internal-link class", () => {
    const container = makeEl("div");
    container.createEl("a", { cls: "external-link", attr: { href: "https://example.com" } });
    const { app, workspace } = makeApp();

    wireInternalLinks(container as unknown as HTMLElement, app, new Component());
    expect(container.querySelectorAll("a.internal-link")).toHaveLength(0);
    expect(workspace.openLinkTextCalls).toEqual([]);
  });

  it("registers listeners via the component so they're removed when the component unloads", () => {
    const container = makeEl("div");
    const anchor = container.createEl("a", { cls: "internal-link", attr: { href: "16-01.md" } });
    const { app, workspace } = makeApp();
    const component = new Component();

    wireInternalLinks(container as unknown as HTMLElement, app, component);
    component.unload();
    anchor.dispatch("click", { preventDefault: vi.fn() });

    expect(workspace.openLinkTextCalls).toEqual([]);
  });
});
