"use client";

import { useCallback, useEffect, useState } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { History, X, RotateCcw } from "lucide-react";

type VersionRow = { id: string; createdAt: string };

function formatVersionTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

type Props = {
  noteId: string;
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestored: (content: JSONContent) => void;
};

export function VersionHistoryPanel({
  noteId,
  editor,
  open,
  onOpenChange,
  onRestored,
}: Props) {
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetch(`/api/notes/${noteId}/versions`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json() as Promise<{ versions: VersionRow[] }>;
      })
      .then((data) => {
        if (!cancelled) setVersions(data.versions ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load version history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, noteId]);

  const restore = useCallback(
    async (versionId: string) => {
      if (!editor) {
        setError("Editor is still loading. Try again in a moment.");
        return;
      }
      if (
        !window.confirm(
          "Replace the current note with this saved version? Your current text will be replaced in the editor (you can save again afterward)."
        )
      ) {
        return;
      }
      setRestoringId(versionId);
      setError(null);
      try {
        const res = await fetch(
          `/api/notes/${noteId}/versions/${versionId}/restore`,
          { method: "POST" }
        );
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          content?: JSONContent;
        };
        if (!res.ok) {
          throw new Error(body.error || "Restore failed");
        }
        if (!body.content || typeof body.content !== "object") {
          throw new Error("Invalid restore payload");
        }
        onRestored(body.content);
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Restore failed");
      } finally {
        setRestoringId(null);
      }
    },
    [editor, noteId, onOpenChange, onRestored]
  );

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-zinc-950/40"
        aria-label="Close version history"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-history-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-zinc-600" aria-hidden />
            <h2
              id="version-history-title"
              className="text-base font-semibold text-zinc-900"
            >
              Version history
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {loading && (
            <p className="text-sm text-zinc-500">Loading versions…</p>
          )}
          {!loading && versions.length === 0 && !error && (
            <p className="text-sm text-zinc-500">
              No saved versions yet. Versions are created each time the note
              auto-saves (about every 30 seconds when there are changes).
            </p>
          )}
          <ul className="space-y-2">
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2.5"
              >
                <span className="min-w-0 text-sm text-zinc-800">
                  {formatVersionTime(v.createdAt)}
                </span>
                <button
                  type="button"
                  disabled={restoringId !== null || !editor}
                  onClick={() => void restore(v.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {restoringId === v.id ? "Restoring…" : "Restore"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
