import { Mark, mergeAttributes } from "@tiptap/core";

/**
 * Wiki-style link to another note in the workspace (`[[` picker inserts this mark).
 */
export const NoteLink = Mark.create({
  name: "noteLink",

  inclusive: false,

  addAttributes() {
    return {
      noteId: {
        default: null,
      },
      label: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "a[data-note-id]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const noteId = el.getAttribute("data-note-id");
          if (!noteId) return false;
          return {
            noteId,
            label: el.textContent ?? "",
          };
        },
      },
    ];
  },

  renderHTML({ mark, HTMLAttributes }) {
    const noteId = mark.attrs.noteId as string | null;
    if (!noteId) {
      return ["span", mergeAttributes(HTMLAttributes, { class: "note-wiki-link-broken" }), 0];
    }
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-note-id": noteId,
        href: `/notes/${noteId}`,
        class: "note-wiki-link",
        rel: "noopener noreferrer",
      }),
      0,
    ];
  },
});
