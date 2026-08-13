import { Keymap, type App } from "obsidian";

export function wireInternalLinks(el: HTMLElement, app: App): void {
  const sourcePath = "";
  el.querySelectorAll<HTMLAnchorElement>("a.internal-link").forEach((a) => {
    a.addEventListener("click", (evt: MouseEvent) => {
      evt.preventDefault();
      const href = a.getAttribute("href");
      if (href) void app.workspace.openLinkText(href, sourcePath, Keymap.isModEvent(evt));
    });
    a.addEventListener("mouseover", (evt: MouseEvent) => {
      const href = a.getAttribute("href");
      if (!href) return;
      app.workspace.trigger("hover-link", {
        event: evt,
        source: "preview",
        hoverParent: { hoverPopover: null },
        targetEl: a,
        linktext: href,
        sourcePath,
      });
    });
  });
}
