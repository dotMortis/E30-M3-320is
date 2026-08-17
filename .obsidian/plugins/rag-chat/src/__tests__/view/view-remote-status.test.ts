import { describe, expect, it } from "vitest";
import { fake, makeView } from "./harness";

function getDot(view: ReturnType<typeof makeView>["view"]) {
  return fake(view.contentEl).querySelectorAll(".rag-chat-remote-status-dot")[0];
}

describe("RagChatView remote status dot", () => {
  it("renders a hidden status dot inside the mic button by default (feature disabled -> null status)", async () => {
    const { view, plugin } = makeView();
    (plugin.getRemoteStatus as any).mockReturnValue(null);
    await view.onOpen();

    const dot = getDot(view);
    expect(dot).toBeDefined();
    expect(dot.classes.has("is-visible")).toBe(false);
  });

  it("stays hidden for 'unsupported' status", async () => {
    const { view, plugin } = makeView();
    (plugin.getRemoteStatus as any).mockReturnValue("unsupported");
    await view.onOpen();

    expect(getDot(view).classes.has("is-visible")).toBe(false);
  });

  it("shows green 'is-connected' for a connected status", async () => {
    const { view, plugin } = makeView();
    (plugin.getRemoteStatus as any).mockReturnValue("connected");
    await view.onOpen();

    const dot = getDot(view);
    expect(dot.classes.has("is-visible")).toBe(true);
    expect(dot.classes.has("is-connected")).toBe(true);
    expect(dot.classes.has("is-disconnected")).toBe(false);
  });

  it("shows grey 'is-disconnected' for disconnected/starting/error statuses", async () => {
    const { view } = makeView();
    await view.onOpen();

    for (const status of ["disconnected", "starting", "error"] as const) {
      view.setRemoteStatus(status);
      const dot = getDot(view);
      expect(dot.classes.has("is-visible")).toBe(true);
      expect(dot.classes.has("is-connected")).toBe(false);
      expect(dot.classes.has("is-disconnected")).toBe(true);
    }
  });

  it("setRemoteStatus(null) hides the dot again", async () => {
    const { view } = makeView();
    await view.onOpen();
    view.setRemoteStatus("connected");
    expect(getDot(view).classes.has("is-visible")).toBe(true);

    view.setRemoteStatus(null);
    expect(getDot(view).classes.has("is-visible")).toBe(false);
  });

  it("pulseRemoteIndicator() briefly adds the is-pulse class", async () => {
    const { view } = makeView();
    await view.onOpen();

    view.pulseRemoteIndicator();

    expect(getDot(view).classes.has("is-pulse")).toBe(true);
  });
});
