import type { JSONContent } from "@tiptap/core";

/**
 * Flattens a TipTap/ProseMirror JSON document to plain text for AI prompts.
 */
export function tiptapJsonToPlainText(doc: JSONContent | null | undefined): string {
  if (!doc) return "";

  function inner(node: JSONContent): string {
    if (node.type === "text") return node.text ?? "";
    if (node.type === "hardBreak") return "\n";
    if (node.type === "image") {
      const cap =
        typeof node.attrs?.caption === "string"
          ? node.attrs.caption.trim()
          : "";
      return cap ? `\n[image: ${cap}]\n` : "\n[image]\n";
    }

    const children = node.content ?? [];
    const body = children.map(inner).join("");

    if (
      node.type === "paragraph" ||
      node.type === "heading" ||
      node.type === "listItem" ||
      node.type === "blockquote"
    ) {
      return `${body}\n`;
    }
    if (node.type === "bulletList" || node.type === "orderedList") {
      return `${body}\n`;
    }
    if (node.type === "codeBlock") {
      return `${body}\n`;
    }
    return body;
  }

  return inner(doc).replace(/\n{3,}/g, "\n\n").trim();
}
