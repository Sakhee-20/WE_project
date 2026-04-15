import type { JSONContent } from "@tiptap/core";

/**
 * Collect target note ids from `noteLink` marks in TipTap JSON.
 */
export function extractNoteLinkIdsFromContent(content: unknown): string[] {
  const out = new Set<string>();
  function walk(node: JSONContent | undefined) {
    if (!node) return;
    const marks = node.marks;
    if (Array.isArray(marks)) {
      for (const m of marks) {
        if (
          m.type === "noteLink" &&
          m.attrs &&
          typeof m.attrs.noteId === "string" &&
          m.attrs.noteId.length > 0
        ) {
          out.add(m.attrs.noteId);
        }
      }
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child);
      }
    }
  }
  if (content && typeof content === "object") {
    walk(content as JSONContent);
  }
  return [...out];
}
