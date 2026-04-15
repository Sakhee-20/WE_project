"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Backlink = {
  id: string;
  title: string;
  href: string;
};

type Props = {
  noteId: string;
};

export function NoteBacklinks({ noteId }: Props) {
  const [items, setItems] = useState<Backlink[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}/backlinks`);
        if (!res.ok) {
          if (!cancelled) {
            setError(res.status === 401 ? "Sign in to see backlinks" : "Could not load backlinks");
          }
          return;
        }
        const data = (await res.json()) as { backlinks: Backlink[] };
        if (!cancelled) {
          setItems(Array.isArray(data.backlinks) ? data.backlinks : []);
        }
      } catch {
        if (!cancelled) setError("Could not load backlinks");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  return (
    <section aria-labelledby={`backlinks-${noteId}`}>
      <h2
        id={`backlinks-${noteId}`}
        className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-400"
      >
        <Link2 className="h-3.5 w-3.5" aria-hidden />
        Backlinks
      </h2>
      {error ? (
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{error}</p>
      ) : items === null ? (
        <p className="text-[13px] text-zinc-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
          No other notes link here yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((b) => (
            <li key={b.id}>
              <Link
                href={b.href}
                className={cn(
                  "block rounded-md px-2 py-1.5 text-[13px] font-medium text-blue-700 underline-offset-2 hover:bg-zinc-100 hover:underline dark:text-blue-400 dark:hover:bg-zinc-800/80"
                )}
              >
                {b.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
