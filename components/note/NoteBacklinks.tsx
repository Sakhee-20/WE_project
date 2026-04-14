"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { buildNotebookNoteHref } from "@/lib/notebook-paths";

export type BacklinkRow = {
  noteId: string;
  title: string;
  chapterId: string;
  subjectId: string;
  subjectName: string;
  chapterTitle: string;
};

type Props = {
  noteId: string;
};

export function NoteBacklinks({ noteId }: Props) {
  const [backlinks, setBacklinks] = useState<BacklinkRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBacklinks(null);
    setError(false);
    void (async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}/backlinks`);
        if (!res.ok) {
          if (!cancelled) setError(true);
          return;
        }
        const data = (await res.json()) as { backlinks?: BacklinkRow[] };
        if (!cancelled) setBacklinks(data.backlinks ?? []);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  if (error) return null;
  if (backlinks === null) {
    return (
      <section
        className="border-t border-zinc-100 px-2.5 py-3 sm:px-4 dark:border-zinc-800"
        aria-label="Backlinks"
      >
        <h2 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          Backlinks
        </h2>
        <p className="text-xs text-zinc-400">Loading…</p>
      </section>
    );
  }

  if (backlinks.length === 0) {
    return (
      <section
        className="border-t border-zinc-100 px-2.5 py-3 sm:px-4 dark:border-zinc-800"
        aria-label="Backlinks"
      >
        <h2 className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          Backlinks
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          No other notes link here yet.
        </p>
      </section>
    );
  }

  return (
    <section
      className="border-t border-zinc-100 px-2.5 py-3 sm:px-4 dark:border-zinc-800"
      aria-label="Backlinks"
    >
      <h2 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        <Link2 className="h-3.5 w-3.5" aria-hidden />
        Backlinks
      </h2>
      <ul className="space-y-1.5">
        {backlinks.map((b) => (
          <li key={b.noteId}>
            <Link
              href={buildNotebookNoteHref(b.subjectId, b.chapterId, b.noteId)}
              className="block rounded-md px-2 py-1.5 text-sm text-blue-600 transition-colors hover:bg-zinc-50 dark:text-blue-400 dark:hover:bg-zinc-900/60"
            >
              <span className="font-medium">
                {b.title?.trim() || "Untitled"}
              </span>
              <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">
                {b.subjectName} · {b.chapterTitle}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
