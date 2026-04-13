import { arrayMove } from "@dnd-kit/sortable";
import type { SubjectWithChaptersAndNotes } from "@/lib/subjects-tree";

export type ParsedNodeId =
  | { kind: "subject"; raw: string }
  | { kind: "chapter"; raw: string }
  | { kind: "note"; raw: string };

export function parseSidebarNodeId(dndId: string): ParsedNodeId | null {
  const i = dndId.indexOf(":");
  if (i <= 0) return null;
  const prefix = dndId.slice(0, i);
  const raw = dndId.slice(i + 1);
  if (prefix === "subject") return { kind: "subject", raw };
  if (prefix === "chapter") return { kind: "chapter", raw };
  if (prefix === "note") return { kind: "note", raw };
  return null;
}

function cloneSubjects(
  subjects: SubjectWithChaptersAndNotes[]
): SubjectWithChaptersAndNotes[] {
  return structuredClone(subjects);
}

/** Apply a drag-drop result to the subject tree. Returns null if nothing changes. */
export function applyWorkspaceDrag(
  subjects: SubjectWithChaptersAndNotes[] | undefined,
  activeId: string,
  overId: string
): SubjectWithChaptersAndNotes[] | null {
  if (!subjects?.length) return null;
  const active = parseSidebarNodeId(activeId);
  const over = parseSidebarNodeId(overId);
  if (!active || !over || activeId === overId) return null;

  if (
    active.raw.startsWith("optimistic:") ||
    active.raw.startsWith("optimistic-chapter:")
  ) {
    return null;
  }

  if (active.kind === "subject" && over.kind === "subject") {
    const from = subjects.findIndex((s) => s.id === active.raw);
    const to = subjects.findIndex((s) => s.id === over.raw);
    if (from < 0 || to < 0) return null;
    return arrayMove(cloneSubjects(subjects), from, to);
  }

  if (active.kind === "chapter") {
    if (over.kind === "chapter") {
      return moveChapterRelativeToChapter(
        subjects,
        active.raw,
        over.raw
      );
    }
    if (over.kind === "subject") {
      return moveChapterToSubjectEnd(subjects, active.raw, over.raw);
    }
  }

  if (active.kind === "note") {
    if (over.kind === "note") {
      return moveNoteRelativeToNote(subjects, active.raw, over.raw);
    }
    if (over.kind === "chapter") {
      return moveNoteToChapterEnd(subjects, active.raw, over.raw);
    }
  }

  return null;
}

function findChapterParent(
  subjects: SubjectWithChaptersAndNotes[],
  chapterId: string
): { subject: SubjectWithChaptersAndNotes; index: number } | null {
  for (const s of subjects) {
    const index = s.chapters.findIndex((c) => c.id === chapterId);
    if (index >= 0) return { subject: s, index };
  }
  return null;
}

function findNoteLocation(
  subjects: SubjectWithChaptersAndNotes[],
  noteId: string
): {
  subject: SubjectWithChaptersAndNotes;
  chapterIndex: number;
  noteIndex: number;
} | null {
  for (const s of subjects) {
    for (let ci = 0; ci < s.chapters.length; ci++) {
      const ni = s.chapters[ci].notes.findIndex((n) => n.id === noteId);
      if (ni >= 0) return { subject: s, chapterIndex: ci, noteIndex: ni };
    }
  }
  return null;
}

function moveChapterRelativeToChapter(
  subjects: SubjectWithChaptersAndNotes[],
  activeChapterId: string,
  overChapterId: string
): SubjectWithChaptersAndNotes[] | null {
  const next = cloneSubjects(subjects);
  const from = findChapterParent(next, activeChapterId);
  const to = findChapterParent(next, overChapterId);
  if (!from || !to) return null;

  if (from.subject.id === to.subject.id) {
    const ch = from.subject.chapters;
    const oldIndex = ch.findIndex((c) => c.id === activeChapterId);
    const newIndex = ch.findIndex((c) => c.id === overChapterId);
    if (oldIndex < 0 || newIndex < 0) return null;
    from.subject.chapters = arrayMove(ch, oldIndex, newIndex);
    return next;
  }

  const [moved] = from.subject.chapters.splice(from.index, 1);
  if (!moved) return null;
  const toIndex = to.subject.chapters.findIndex((c) => c.id === overChapterId);
  if (toIndex < 0) return null;
  to.subject.chapters.splice(toIndex, 0, moved);
  return next;
}

function moveChapterToSubjectEnd(
  subjects: SubjectWithChaptersAndNotes[],
  activeChapterId: string,
  targetSubjectId: string
): SubjectWithChaptersAndNotes[] | null {
  const next = cloneSubjects(subjects);
  const from = findChapterParent(next, activeChapterId);
  const target = next.find((s) => s.id === targetSubjectId);
  if (!from || !target) return null;

  const [moved] = from.subject.chapters.splice(from.index, 1);
  if (!moved) return null;
  target.chapters.push(moved);
  return next;
}

function moveNoteRelativeToNote(
  subjects: SubjectWithChaptersAndNotes[],
  activeNoteId: string,
  overNoteId: string
): SubjectWithChaptersAndNotes[] | null {
  const next = cloneSubjects(subjects);
  const from = findNoteLocation(next, activeNoteId);
  const to = findNoteLocation(next, overNoteId);
  if (!from || !to) return null;

  if (
    from.subject.id === to.subject.id &&
    from.chapterIndex === to.chapterIndex
  ) {
    const notes = from.subject.chapters[from.chapterIndex].notes;
    const oldIndex = notes.findIndex((n) => n.id === activeNoteId);
    const newIndex = notes.findIndex((n) => n.id === overNoteId);
    if (oldIndex < 0 || newIndex < 0) return null;
    from.subject.chapters[from.chapterIndex].notes = arrayMove(
      notes,
      oldIndex,
      newIndex
    );
    return next;
  }

  const chFrom = from.subject.chapters[from.chapterIndex];
  const [moved] = chFrom.notes.splice(from.noteIndex, 1);
  if (!moved) return null;
  const targetCh = to.subject.chapters[to.chapterIndex];
  const overIdx = targetCh.notes.findIndex((n) => n.id === overNoteId);
  if (overIdx < 0) return null;
  targetCh.notes.splice(overIdx, 0, moved);
  return next;
}

function moveNoteToChapterEnd(
  subjects: SubjectWithChaptersAndNotes[],
  activeNoteId: string,
  targetChapterId: string
): SubjectWithChaptersAndNotes[] | null {
  const next = cloneSubjects(subjects);
  const from = findNoteLocation(next, activeNoteId);
  if (!from) return null;

  const to = findChapterParent(next, targetChapterId);
  if (!to) return null;

  const [moved] = from.subject.chapters[from.chapterIndex].notes.splice(
    from.noteIndex,
    1
  );
  if (!moved) return null;

  to.subject.chapters[to.index].notes.push(moved);
  return next;
}
