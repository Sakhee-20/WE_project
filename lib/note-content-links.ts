import type { JSONContent } from "@tiptap/core";

/** TipTap mark name for internal note links. */
export const NOTE_LINK_MARK = "noteLink";

/**
 * Collect distinct target note ids from stored TipTap JSON (noteLink marks on text).
 */
export function extractLinkedNoteIdsFromTiptapJson(content: unknown): string[] {
  const seen = new Set<string>();
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as JSONContent;
    if (Array.isArray(n.marks)) {
      for (const m of n.marks) {
        if (
          m.type === NOTE_LINK_MARK &&
          m.attrs &&
          typeof m.attrs.noteId === "string" &&
          m.attrs.noteId.length > 0
        ) {
          seen.add(m.attrs.noteId);
        }
      }
    }
    if (Array.isArray(n.content)) {
      for (const c of n.content) walk(c);
    }
  };
  walk(content);
  return [...seen];
}
