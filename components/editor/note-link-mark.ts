import { Mark, mergeAttributes } from "@tiptap/core";
import { NOTE_LINK_MARK } from "@/lib/note-content-links";

export const NoteLinkMark = Mark.create({
  name: NOTE_LINK_MARK,
  inclusive: false,

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-note-id"),
        renderHTML: (attrs) =>
          attrs.noteId
            ? { "data-note-id": attrs.noteId as string }
            : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "a[data-note-id]",
        getAttrs: (el) => {
          const id = (el as HTMLElement).getAttribute("data-note-id");
          return id ? { noteId: id } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const noteId = HTMLAttributes.noteId as string | null | undefined;
    if (!noteId) {
      return ["span", mergeAttributes(HTMLAttributes, { class: "note-link" }), 0];
    }
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        href: `/notes/${noteId}`,
        class:
          "note-link font-medium text-blue-600 underline decoration-blue-600/40 underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
        rel: "noopener noreferrer",
        "data-note-id": noteId,
      }),
      0,
    ];
  },
});
