/**
 * Note visible in the app (not trashed; parent chapter and subject active).
 * Use for GET/PATCH/editor access.
 */
export function activeNoteWhere(userId: string, noteId: string) {
  return {
    id: noteId,
    deletedAt: null,
    chapter: {
      deletedAt: null,
      subject: { userId, deletedAt: null },
    },
  };
}
