"use client";

import { useEffect } from "react";

type Props = {
  noteId: string;
};

/**
 * Records a "recently opened" event for the signed-in owner (dashboard).
 */
export function NoteOpenTracker({ noteId }: Props) {
  useEffect(() => {
    void fetch(`/api/notes/${noteId}/open`, { method: "POST" });
  }, [noteId]);

  return null;
}
