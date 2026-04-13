import type { SubjectSidebarTreeNode } from "@/components/sidebar/types";
import { buildNotebookNoteHref } from "@/lib/notebook-paths";

/** Shape returned by GET /api/subjects (nested include). */
export type SubjectWithChaptersAndNotes = {
  id: string;
  name: string;
  isFavorite?: boolean;
  chapters: {
    id: string;
    title: string;
    notes: {
      id: string;
      title: string;
      isFavorite?: boolean;
      /** TipTap JSON document from Prisma (for sidebar search). */
      content?: unknown;
      createdAt?: string;
      updatedAt?: string;
    }[];
  }[];
};

export function mapSubjectsToSidebarTree(
  subjects: SubjectWithChaptersAndNotes[]
): SubjectSidebarTreeNode[] {
  return subjects.map((subject) => ({
    id: `subject:${subject.id}`,
    kind: "subject" as const,
    type: "folder" as const,
    name: subject.name,
    subjectId: subject.id,
    children: subject.chapters.map((chapter) => ({
      id: `chapter:${chapter.id}`,
      kind: "chapter" as const,
      type: "folder" as const,
      title: chapter.title,
      subjectId: subject.id,
      chapterId: chapter.id,
      children: chapter.notes.map((note) => ({
        id: `note:${note.id}`,
        kind: "note" as const,
        type: "page" as const,
        title: note.title,
        subjectId: subject.id,
        chapterId: chapter.id,
        isFavorite: Boolean(note.isFavorite),
        href: note.id.startsWith("optimistic:")
          ? null
          : buildNotebookNoteHref(subject.id, chapter.id, note.id),
      })),
    })),
  }));
}
