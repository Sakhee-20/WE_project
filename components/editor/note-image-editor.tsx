"use client";

import { ReactNodeViewRenderer } from "@tiptap/react";
import { NoteImage } from "./note-image-extension";
import { NoteImageView } from "./note-image-view";

/**
 * Editor-only image node with React node view (resize handles, figure layout).
 * Use plain {@link NoteImage} in server-side `generateHTML` (no React mount).
 */
export const NoteImageEditor = NoteImage.extend({
  name: "image",

  addNodeView() {
    return ReactNodeViewRenderer(NoteImageView);
  },
});
