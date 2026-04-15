import StarterKit from "@tiptap/starter-kit";
import { NoteImage } from "@/components/editor/note-image-extension";
import { NoteLink } from "@/components/editor/note-link-extension";

/**
 * Same schema as the note editors so generateHTML matches stored JSON.
 */
export const noteExportExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  NoteLink,
  NoteImage.configure({
    inline: false,
    allowBase64: false,
    HTMLAttributes: {
      class:
        "max-w-full h-auto rounded-lg border border-zinc-200 my-3 shadow-sm",
    },
  }),
];
