import type { JSONContent } from "@tiptap/core";

/** Empty TipTap / ProseMirror document (StarterKit-compatible). */
export const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/** Wrap plain text in a single paragraph doc (seed / migration helpers). */
export function textToDoc(text: string): JSONContent {
  const t = text.trim();
  if (!t) return EMPTY_DOC;
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: t }],
      },
    ],
  };
}
