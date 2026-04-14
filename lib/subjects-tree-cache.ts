import type { SubjectWithChaptersAndNotes } from "@/lib/subjects-tree";

export type SidebarNoteStub = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
};

export function addNoteToChapter(
  subjects: SubjectWithChaptersAndNotes[] | undefined,
  chapterId: string,
  note: SidebarNoteStub
): SubjectWithChaptersAndNotes[] | undefined {
  if (!subjects) return subjects;
  return subjects.map((s) => ({
    ...s,
    chapters: s.chapters.map((ch) =>
      ch.id === chapterId ? { ...ch, notes: [...ch.notes, note] } : ch
    ),
  }));
}

export function replaceNoteInChapter(
  subjects: SubjectWithChaptersAndNotes[] | undefined,
  chapterId: string,
  removeId: string,
  note: SidebarNoteStub
): SubjectWithChaptersAndNotes[] | undefined {
  if (!subjects) return subjects;
  return subjects.map((s) => ({
    ...s,
    chapters: s.chapters.map((ch) => {
      if (ch.id !== chapterId) return ch;
      const notes = ch.notes.filter((n) => n.id !== removeId);
      return { ...ch, notes: [...notes, note] };
    }),
  }));
}

export function removeNoteFromChapter(
  subjects: SubjectWithChaptersAndNotes[] | undefined,
  chapterId: string,
  noteId: string
): SubjectWithChaptersAndNotes[] | undefined {
  if (!subjects) return subjects;
  return subjects.map((s) => ({
    ...s,
    chapters: s.chapters.map((ch) =>
      ch.id === chapterId
        ? { ...ch, notes: ch.notes.filter((n) => n.id !== noteId) }
        : ch
    ),
  }));
}

/** Chapter row for sidebar cache (notes may omit `content`). */
export type SidebarChapterStub = {
  id: string;
  title: string;
  notes: SidebarNoteStub[];
};

export function addChapterWithNoteToSubject(
  subjects: SubjectWithChaptersAndNotes[] | undefined,
  subjectId: string,
  chapter: SidebarChapterStub
): SubjectWithChaptersAndNotes[] | undefined {
  if (!subjects) return subjects;
  return subjects.map((s) =>
    s.id === subjectId ? { ...s, chapters: [...s.chapters, chapter] } : s
  );
}

export function removeChapterFromSubject(
  subjects: SubjectWithChaptersAndNotes[] | undefined,
  subjectId: string,
  chapterId: string
): SubjectWithChaptersAndNotes[] | undefined {
  if (!subjects) return subjects;
  return subjects.map((s) =>
    s.id === subjectId
      ? { ...s, chapters: s.chapters.filter((ch) => ch.id !== chapterId) }
      : s
  );
}

export function removeSubjectFromSidebar(
  subjects: SubjectWithChaptersAndNotes[] | undefined,
  subjectId: string
): SubjectWithChaptersAndNotes[] | undefined {
  if (!subjects) return subjects;
  return subjects.filter((s) => s.id !== subjectId);
}

export function replaceOptimisticChapterWithReal(
  subjects: SubjectWithChaptersAndNotes[] | undefined,
  subjectId: string,
  optimisticChapterId: string,
  realChapterId: string,
  chapterTitle: string,
  realNote: SidebarNoteStub
): SubjectWithChaptersAndNotes[] | undefined {
  if (!subjects) return subjects;
  return subjects.map((s) => {
    if (s.id !== subjectId) return s;
    return {
      ...s,
      chapters: s.chapters.map((ch) =>
        ch.id === optimisticChapterId
          ? { id: realChapterId, title: chapterTitle, notes: [realNote] }
          : ch
      ),
    };
  });
}

/** Swap optimistic chapter id for real id; keeps existing `notes` (usually []). */
export function replaceOptimisticChapterMeta(
  subjects: SubjectWithChaptersAndNotes[] | undefined,
  subjectId: string,
  optimisticChapterId: string,
  realChapterId: string,
  chapterTitle: string
): SubjectWithChaptersAndNotes[] | undefined {
  if (!subjects) return subjects;
  return subjects.map((s) => {
    if (s.id !== subjectId) return s;
    return {
      ...s,
      chapters: s.chapters.map((ch) =>
        ch.id === optimisticChapterId
          ? { ...ch, id: realChapterId, title: chapterTitle }
          : ch
      ),
    };
  });
}
