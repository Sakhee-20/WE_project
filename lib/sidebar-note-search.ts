import type { JSONContent } from "@tiptap/core";
import Fuse from "fuse.js";
import { buildNotebookNoteHref } from "@/lib/notebook-paths";
import { tiptapJsonToPlainText } from "@/lib/tiptap/json-to-plain-text";
import type { SubjectWithChaptersAndNotes } from "@/lib/subjects-tree";

export type SidebarSearchableNote = {
  noteId: string;
  title: string;
  contentPlain: string;
  subjectName: string;
  chapterTitle: string;
  href: string | null;
};

export function buildSidebarSearchIndex(
  subjects: SubjectWithChaptersAndNotes[]
): SidebarSearchableNote[] {
  const list: SidebarSearchableNote[] = [];
  for (const subject of subjects) {
    for (const chapter of subject.chapters) {
      for (const note of chapter.notes) {
        if (note.id.startsWith("optimistic:")) continue;
        list.push({
          noteId: note.id,
          title: note.title,
          contentPlain: tiptapJsonToPlainText(note.content as JSONContent),
          subjectName: subject.name,
          chapterTitle: chapter.title,
          href: buildNotebookNoteHref(subject.id, chapter.id, note.id),
        });
      }
    }
  }
  return list;
}

export function createSidebarNotesFuse(notes: SidebarSearchableNote[]) {
  return new Fuse(notes, {
    keys: [
      { name: "title", weight: 0.45 },
      { name: "contentPlain", weight: 0.55 },
    ],
    includeMatches: true,
    ignoreLocation: true,
    threshold: 0.38,
    minMatchCharLength: 1,
  });
}

export function matchKeyName(key: unknown): string {
  if (typeof key === "string") return key;
  if (
    key &&
    typeof key === "object" &&
    "path" in key &&
    Array.isArray((key as { path: unknown }).path)
  ) {
    return (key as { path: string[] }).path.join(".");
  }
  return "";
}
