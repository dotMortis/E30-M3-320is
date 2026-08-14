import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { Modal, resetObsidianMocks } from "../mocks/obsidian";
import type { FakeElement } from "../mocks/dom";

vi.mock("obsidian", async () => {
  const mock = await import("../mocks/obsidian");
  return mock;
});

let confirmModal: typeof import("../../view/confirm-modal").confirmModal;

beforeEach(async () => {
  resetObsidianMocks();
  ({ confirmModal } = await import("../../view/confirm-modal"));
});

function fake(el: unknown): FakeElement {
  return el as FakeElement;
}

function lastModal(): Modal {
  return Modal.instances[Modal.instances.length - 1];
}

describe("confirmModal", () => {
  it("renders the given message", async () => {
    void confirmModal({} as App, "Chat leeren?");
    const paragraph = fake(lastModal().contentEl).querySelectorAll("p")[0];
    expect(paragraph.text).toBe("Chat leeren?");
  });

  it("resolves true when the 'Ja' button is clicked", async () => {
    const promise = confirmModal({} as App, "Wirklich?");
    const yesButton = fake(lastModal().contentEl).querySelectorAll("button.mod-warning")[0];
    yesButton.dispatch("click");
    await expect(promise).resolves.toBe(true);
  });

  it("resolves false when the 'Nein' button is clicked", async () => {
    const promise = confirmModal({} as App, "Wirklich?");
    const buttons = fake(lastModal().contentEl).querySelectorAll("button");
    const noButton = buttons.find((b) => b.text === "Nein")!;
    noButton.dispatch("click");
    await expect(promise).resolves.toBe(false);
  });

  it("resolves false when the modal is closed without a button click", async () => {
    const promise = confirmModal({} as App, "Wirklich?");
    lastModal().close();
    await expect(promise).resolves.toBe(false);
  });

  it("keeps the button-click result when close() runs again afterward", async () => {
    const promise = confirmModal({} as App, "Wirklich?");
    const yesButton = fake(lastModal().contentEl).querySelectorAll("button.mod-warning")[0];
    yesButton.dispatch("click");
    lastModal().close();
    await expect(promise).resolves.toBe(true);
  });
});
