"use client";

import type { JSONContent } from "@tiptap/core";
import { NoteEditorClassic } from "./NoteEditorClassic";
import { NoteEditorCollaborative } from "./NoteEditorCollaborative";

const collabEnabled =
  process.env.NEXT_PUBLIC_LIVEBLOCKS_ENABLED === "true";

type Props = {
  noteId: string;
  initialTitle: string;
  initialContent: JSONContent;
  /** Focus and select title once (e.g. after creating a note via `?focusTitle=1`). */
  autoFocusTitle?: boolean;
};

export function NoteEditor(props: Props) {
  if (collabEnabled) {
    return <NoteEditorCollaborative {...props} />;
  }
  return <NoteEditorClassic {...props} />;
}
