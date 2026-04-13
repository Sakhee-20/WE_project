"use client";

import { useCallback, useEffect, useState } from "react";
import { Link2, Trash2, Copy, Loader2 } from "lucide-react";

type ShareRow = {
  id: string;
  token: string;
  canEdit: boolean;
  createdAt: string;
};

type Props = {
  noteId: string;
};

export function NoteSharePanel({ noteId }: Props) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}/shares`);
      const data = (await res.json()) as {
        shares?: ShareRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Failed to load shares");
        return;
      }
      setShares(data.shares ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function createShare() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canEdit }),
      });
      const data = (await res.json()) as { share?: ShareRow; error?: string };
      if (!res.ok) {
        setError(data.error || "Could not create link");
        return;
      }
      if (data.share) {
        setShares((s) => [data.share!, ...s]);
      }
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function removeShare(id: string) {
    try {
      const res = await fetch(`/api/notes/${noteId}/shares/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShares((s) => s.filter((x) => x.id !== id));
      }
    } catch {
      /* ignore */
    }
  }

  function copyUrl(token: string, id: string) {
    const url = `${window.location.origin}/share/${token}`;
    void navigator.clipboard.writeText(url);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
      >
        <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Share
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/10"
            aria-label="Close share panel"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-zinc-200 bg-white p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-zinc-900">Share note</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Anyone with the link can open the note. Turn on edit to allow
              changes and live cursors.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-700">
                <input
                  type="checkbox"
                  checked={canEdit}
                  onChange={(e) => setCanEdit(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                Allow editing
              </label>
            </div>

            <button
              type="button"
              disabled={creating}
              onClick={() => void createShare()}
              className="mt-3 w-full rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {creating ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating…
                </span>
              ) : (
                "Create link"
              )}
            </button>

            {error && (
              <p className="mt-2 text-xs text-red-600" role="alert">
                {error}
              </p>
            )}

            <div className="mt-4 border-t border-zinc-100 pt-3">
              <p className="text-xs font-medium text-zinc-600">Active links</p>
              {loading ? (
                <p className="mt-2 text-xs text-zinc-400">Loading…</p>
              ) : shares.length === 0 ? (
                <p className="mt-2 text-xs text-zinc-400">None yet</p>
              ) : (
                <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                  {shares.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col gap-1 rounded-lg bg-zinc-50 px-2 py-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-[10px] text-zinc-500">
                          /share/{s.token.slice(0, 12)}…
                        </p>
                        <p className="text-zinc-600">
                          {s.canEdit ? "Can edit" : "View only"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          title="Copy link"
                          onClick={() => copyUrl(s.token, s.id)}
                          className="rounded p-1 text-zinc-500 hover:bg-white hover:text-zinc-800"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Revoke"
                          onClick={() => void removeShare(s.id)}
                          className="rounded p-1 text-red-500 hover:bg-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      </div>
                      {copiedId === s.id && (
                        <p className="text-[10px] text-emerald-600">Copied</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
