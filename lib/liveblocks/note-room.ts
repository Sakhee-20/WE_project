const PREFIX = "note:" as const;

export function noteRoomId(noteId: string): string {
  return `${PREFIX}${noteId}`;
}

export function parseNoteRoomId(room: string | undefined): string | null {
  if (!room || !room.startsWith(PREFIX)) return null;
  const id = room.slice(PREFIX.length);
  return id.length > 0 ? id : null;
}
