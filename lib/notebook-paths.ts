/** Canonical app route for opening a note from the notebook sidebar. */
export function buildNotebookNoteHref(
  subjectId: string,
  chapterId: string,
  noteId: string
): string {
  return `/notebook/${subjectId}/${chapterId}/${noteId}`;
}

const NOTEBOOK_NOTE_RE =
  /^\/notebook\/([^/]+)\/([^/]+)\/([^/]+)(?:\/|$)/;

export function parseNotebookNotePath(pathname: string): {
  subjectId: string;
  chapterId: string;
  noteId: string;
} | null {
  const m = pathname.match(NOTEBOOK_NOTE_RE);
  if (!m) return null;
  return { subjectId: m[1], chapterId: m[2], noteId: m[3] };
}
