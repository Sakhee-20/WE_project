import { mergeAttributes } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import Image from "@tiptap/extension-image";

export type NoteImageAlign = "left" | "center" | "right";

/**
 * Block images as figure, optional caption, alignment, and width (percentage of content width).
 * Backward compatible with plain &lt;img&gt; nodes from older notes.
 */
export const NoteImage = Image.extend({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      widthPercent: {
        default: 100,
        parseHTML: (element) => {
          const el = element as HTMLElement;
          const img =
            el.tagName === "IMG"
              ? el
              : (el.querySelector("img") as HTMLImageElement | null);
          const w = img?.getAttribute("data-width-percent");
          const n = w ? parseInt(w, 10) : NaN;
          if (!Number.isFinite(n) || n < 1 || n > 100) return 100;
          return n;
        },
        renderHTML: (attributes) => {
          const n = attributes.widthPercent as number;
          if (typeof n !== "number" || n >= 100) return {};
          return { "data-width-percent": String(n) };
        },
      },
      align: {
        default: "center" satisfies NoteImageAlign,
      },
      caption: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure.note-editor-figure",
        priority: 60,
        getAttrs: (node) => {
          const figure = node as HTMLElement;
          const img = figure.querySelector("img[src]");
          if (!img) return false;
          const cap = figure.querySelector("figcaption");
          let align: NoteImageAlign = "center";
          if (figure.classList.contains("note-editor-figure--align-left"))
            align = "left";
          else if (figure.classList.contains("note-editor-figure--align-right"))
            align = "right";
          const wp = img.getAttribute("data-width-percent");
          let widthPercent = 100;
          if (wp) {
            const n = parseInt(wp, 10);
            if (Number.isFinite(n) && n >= 1 && n <= 100) widthPercent = n;
          }
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt"),
            title: img.getAttribute("title"),
            widthPercent,
            align,
            caption: cap?.textContent?.trim() ?? "",
          };
        },
      },
      {
        tag: 'img[src]:not([src^="data:"])',
        priority: 51,
        getAttrs: (dom) => {
          const img = dom as HTMLImageElement;
          const wp = img.getAttribute("data-width-percent");
          let widthPercent = 100;
          if (wp) {
            const n = parseInt(wp, 10);
            if (Number.isFinite(n) && n >= 1 && n <= 100) widthPercent = n;
          }
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt"),
            title: img.getAttribute("title"),
            widthPercent,
            align: "center" satisfies NoteImageAlign,
            caption: "",
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const align = (node.attrs.align as NoteImageAlign) || "center";
    const widthPercent =
      typeof node.attrs.widthPercent === "number" ? node.attrs.widthPercent : 100;
    const caption = String(node.attrs.caption ?? "").trim();

    const figureClass = `note-editor-figure note-editor-figure--align-${align}`;

    const widthStyle =
      widthPercent > 0 && widthPercent < 100
        ? `max-width: min(100%, ${widthPercent}%); height: auto;`
        : "max-width: 100%; height: auto;";

    const imgAttrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: "note-editor-img",
      style: `${widthStyle} display: block;`,
      ...(widthPercent < 100
        ? { "data-width-percent": String(widthPercent) }
        : {}),
    });

    const inner: DOMOutputSpec[] = [["img", imgAttrs]];
    if (caption) {
      inner.push([
        "figcaption",
        { class: "note-editor-figcaption" },
        caption,
      ]);
    }

    return ["figure", { class: figureClass }, ...inner];
  },

  addInputRules() {
    return this.parent?.() ?? [];
  },
});
