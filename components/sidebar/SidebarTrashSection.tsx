"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eraser, RotateCcw } from "lucide-react";
import type { TrashItemDto } from "@/lib/trash-types";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TRASH_QUERY_KEY, fetchTrash } from "./trash-sidebar-query";
import { SUBJECTS_SIDEBAR_QUERY_KEY } from "./subjects-sidebar-query";

function kindLabel(kind: TrashItemDto["kind"]): string {
  if (kind === "subject") return "Subject";
  if (kind === "chapter") return "Chapter";
  return "Note";
}

type SidebarTrashSectionProps = {
  showCollapsed: boolean;
};

export function SidebarTrashSection({ showCollapsed }: SidebarTrashSectionProps) {
  const queryClient = useQueryClient();
  const trashQuery = useQuery({
    queryKey: TRASH_QUERY_KEY,
    queryFn: fetchTrash,
    enabled: !showCollapsed,
  });

  const [destroyTarget, setDestroyTarget] = useState<TrashItemDto | null>(
    null
  );

  const invalidateSidebarAndTrash = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: TRASH_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: SUBJECTS_SIDEBAR_QUERY_KEY });
  }, [queryClient]);

  const restoreMutation = useMutation({
    mutationFn: async (item: TrashItemDto) => {
      const res = await fetch("/api/trash/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: item.kind, id: item.id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          typeof data?.error === "string" ? data.error : "Restore failed"
        );
      }
    },
    onSuccess: invalidateSidebarAndTrash,
  });

  const destroyMutation = useMutation({
    mutationFn: async (item: TrashItemDto) => {
      const res = await fetch("/api/trash/destroy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: item.kind, id: item.id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Permanent delete failed"
        );
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRASH_QUERY_KEY });
      setDestroyTarget(null);
    },
  });

  if (showCollapsed) return null;

  const items = trashQuery.data?.items ?? [];
  const busy =
    restoreMutation.isPending ||
    destroyMutation.isPending ||
    trashQuery.isFetching;

  return (
    <>
      <div className="mb-2 shrink-0 px-1">
        <h2 className="mb-1.5 truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-400">
          Trash
        </h2>
        {trashQuery.isError ? (
          <p className="text-[11px] text-red-600 dark:text-red-400">
            Could not load trash.
          </p>
        ) : items.length === 0 && !trashQuery.isLoading ? (
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
            Nothing in trash.
          </p>
        ) : (
          <ScrollArea className="max-h-[200px] pr-2">
            <ul className="space-y-1 pb-1" role="list">
              {trashQuery.isLoading ? (
                <li className="text-[12px] text-zinc-500">Loading…</li>
              ) : (
                items.map((item) => (
                  <li
                    key={`${item.kind}:${item.id}`}
                    className="rounded-md border border-zinc-200/80 bg-white/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/40"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium text-zinc-800 dark:text-zinc-100">
                          {item.title || "Untitled"}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {kindLabel(item.kind)}
                          {item.context ? ` · ${item.context}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-600 dark:text-zinc-300"
                          disabled={busy}
                          title="Restore"
                          onClick={() => restoreMutation.mutate(item)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 hover:text-red-700 dark:text-red-400"
                          disabled={busy}
                          title="Delete permanently"
                          onClick={() => setDestroyTarget(item)}
                        >
                          <Eraser className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </ScrollArea>
        )}
      </div>

      <AlertDialog
        open={destroyTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDestroyTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete forever?</AlertDialogTitle>
            <AlertDialogDescription>
              {destroyTarget ? (
                <>
                  This removes{" "}
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {destroyTarget.title || "Untitled"}
                  </span>{" "}
                  ({kindLabel(destroyTarget.kind).toLowerCase()}) permanently.
                  You cannot undo this.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700"
              disabled={destroyMutation.isPending}
              onClick={() => {
                if (destroyTarget) destroyMutation.mutate(destroyTarget);
              }}
            >
              Delete permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
