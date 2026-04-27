"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  LayoutDashboard,
  Library,
  PanelTop,
  PenSquare,
  Plus,
  StickyNote,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
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
import { InlineCreateField } from "./InlineCreateField";
import { useSubjectsSidebarTree, SUBJECTS_SIDEBAR_QUERY_KEY } from "./subjects-sidebar-query";
import { SidebarTrashSection } from "./SidebarTrashSection";
import { TRASH_QUERY_KEY } from "./trash-sidebar-query";
import { useCreateChapterInSubject } from "./use-create-chapter-in-subject";
import { useCreateNoteInChapter } from "./use-create-note-in-chapter";
import {
  mapSubjectsToSidebarTree,
  type SubjectWithChaptersAndNotes,
} from "@/lib/subjects-tree";
import {
  removeNoteFromChapter,
  removeSubjectFromSidebar,
} from "@/lib/subjects-tree-cache";
import type { SubjectSidebarTreeNode } from "./types";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { IllustrationEmptyWorkspace } from "@/components/ui/notion-empty-illustrations";
import {
  sidebarIndentClass,
  sidebarRowClass,
} from "./sidebar-item-styles";
import {
  collectSidebarFavoritesFromSubjects,
  collectSidebarFavoritesFromTree,
} from "@/lib/sidebar-favorites";
import { NotebookDndTree } from "./NotebookDndTree";
import { TreeNode } from "./TreeNode";
import {
  getAncestorBranchIdsForNoteId,
  parseNoteCuidFromPathname,
} from "./tree-utils";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { useIsMd } from "@/lib/hooks/use-is-md";
import { WE_OPEN_NEW_SUBJECT_EVENT } from "@/lib/workspace-events";
import { MOTION_SIDEBAR_DRAWER, MOTION_SIDEBAR_LAYOUT } from "@/lib/motion-classes";

const STORAGE_WIDTH = "app-sidebar-width";
const STORAGE_COLLAPSED = "app-sidebar-collapsed";
const MIN_W = 220;
const MAX_W = 420;
const DEFAULT_W = 272;
const COLLAPSED_W = 56;

const quickLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/whiteboard", label: "Whiteboard", icon: PenSquare },
  { href: "/angular-dashboard", label: "Angular Dashboard", icon: PanelTop },
];

const newSubjectTriggerClass =
  "flex w-full items-center gap-2 rounded-md py-2.5 px-2 text-left text-[13px] text-zinc-600 transition-[background-color,color] duration-200 ease-in-out hover:bg-zinc-100/85 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/65 dark:hover:text-zinc-100";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export type SidebarProps = {
  notebookTree?: SubjectSidebarTreeNode[];
};

export function Sidebar({ notebookTree }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { mobileOpen, closeMobileSidebar } = useMobileSidebar();
  const isMd = useIsMd();
  const queryClient = useQueryClient();
  const fetchEnabled = notebookTree === undefined;
  const subjectsQuery = useSubjectsSidebarTree(fetchEnabled);

  const tree = useMemo(() => {
    if (notebookTree !== undefined) return notebookTree;
    return mapSubjectsToSidebarTree(subjectsQuery.data ?? []);
  }, [notebookTree, subjectsQuery.data]);

  const favoriteRows = useMemo(() => {
    if (!tree.length) return [];
    if (fetchEnabled && subjectsQuery.data?.length) {
      return collectSidebarFavoritesFromSubjects(subjectsQuery.data);
    }
    return collectSidebarFavoritesFromTree(tree);
  }, [fetchEnabled, subjectsQuery.data, tree]);

  const toggleSubjectFavoriteMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      const res = await fetch(`/api/subjects/${subjectId}/favorite`, {
        method: "PATCH",
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const err = data as { error?: string } | null;
        throw new Error(
          typeof err?.error === "string" ? err.error : "Favorite update failed"
        );
      }
      return data as SubjectWithChaptersAndNotes;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY,
        (prev) => prev?.map((s) => (s.id === updated.id ? updated : s))
      );
    },
  });

  const toggleNoteFavoriteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = await fetch(`/api/notes/${noteId}/favorite`, {
        method: "PATCH",
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const err = data as { error?: string } | null;
        throw new Error(
          typeof err?.error === "string" ? err.error : "Favorite update failed"
        );
      }
      return data as { id: string; isFavorite: boolean };
    },
    onSuccess: ({ id, isFavorite }) => {
      queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY,
        (prev) =>
          prev?.map((s) => ({
            ...s,
            chapters: s.chapters.map((ch) => ({
              ...ch,
              notes: ch.notes.map((n) =>
                n.id === id ? { ...n, isFavorite } : n
              ),
            })),
          }))
      );
    },
  });

  const onToggleFavorite = useCallback(
    (args: { kind: "subject" | "note"; id: string }) => {
      if (args.kind === "subject") {
        toggleSubjectFavoriteMutation.mutate(args.id);
      } else {
        toggleNoteFavoriteMutation.mutate(args.id);
      }
    },
    [toggleNoteFavoriteMutation, toggleSubjectFavoriteMutation]
  );

  const [renameTarget, setRenameTarget] = useState<null | {
    treeNodeId: string;
    kind: "subject" | "note";
    entityId: string;
    initial: string;
  }>(null);
  const [renameValue, setRenameValue] = useState("");

  const renameSubjectMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/subjects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const err = data as { error?: string } | null;
        throw new Error(
          typeof err?.error === "string" ? err.error : "Rename failed"
        );
      }
      return data as SubjectWithChaptersAndNotes;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY,
        (prev) => prev?.map((s) => (s.id === updated.id ? updated : s))
      );
      setRenameTarget(null);
    },
  });

  const renameNoteMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const err = data as { error?: string } | null;
        throw new Error(
          typeof err?.error === "string" ? err.error : "Rename failed"
        );
      }
      return data as { id: string; title: string };
    },
    onSuccess: (note) => {
      queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY,
        (prev) =>
          prev?.map((s) => ({
            ...s,
            chapters: s.chapters.map((ch) => ({
              ...ch,
              notes: ch.notes.map((n) =>
                n.id === note.id ? { ...n, title: note.title } : n
              ),
            })),
          }))
      );
      setRenameTarget(null);
    },
  });

  const commitRename = useCallback(() => {
    if (!renameTarget) return;
    const t = renameValue.trim();
    if (!t) {
      setRenameTarget(null);
      return;
    }
    if (t === renameTarget.initial) {
      setRenameTarget(null);
      return;
    }
    if (renameTarget.kind === "subject") {
      renameSubjectMutation.mutate({
        id: renameTarget.entityId,
        name: t,
      });
    } else {
      renameNoteMutation.mutate({
        id: renameTarget.entityId,
        title: t,
      });
    }
  }, [renameTarget, renameValue, renameNoteMutation, renameSubjectMutation]);

  const cancelRename = useCallback(() => setRenameTarget(null), []);

  const onRequestSidebarRename = useCallback(
    (args: {
      treeNodeId: string;
      kind: "subject" | "note";
      entityId: string;
      currentTitle: string;
    }) => {
      setRenameTarget({
        treeNodeId: args.treeNodeId,
        kind: args.kind,
        entityId: args.entityId,
        initial: args.currentTitle,
      });
      setRenameValue(args.currentTitle);
    },
    []
  );

  const sidebarRename =
    fetchEnabled && renameTarget
      ? {
          treeNodeId: renameTarget.treeNodeId,
          value: renameValue,
          onChange: setRenameValue,
          onSave: commitRename,
          onCancel: cancelRename,
          isPending:
            renameSubjectMutation.isPending || renameNoteMutation.isPending,
        }
      : null;

  const [deleteTarget, setDeleteTarget] = useState<null | {
    kind: "subject" | "note";
    entityId: string;
    chapterId?: string;
    label: string;
  }>(null);

  const deleteSubjectMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      const res = await fetch(`/api/subjects/${subjectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          typeof data?.error === "string" ? data.error : "Delete failed"
        );
      }
    },
    onMutate: async (subjectId) => {
      await queryClient.cancelQueries({ queryKey: SUBJECTS_SIDEBAR_QUERY_KEY });
      const previous = queryClient.getQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY
      );
      queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY,
        (prev) => removeSubjectFromSidebar(prev, subjectId)
      );
      if (pathname.startsWith(`/notebook/${subjectId}/`)) {
        router.replace("/dashboard");
        closeMobileSidebar();
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(SUBJECTS_SIDEBAR_QUERY_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: TRASH_QUERY_KEY });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async ({
      noteId,
    }: {
      noteId: string;
      chapterId: string;
    }) => {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          typeof data?.error === "string" ? data.error : "Delete failed"
        );
      }
    },
    onMutate: async ({ noteId, chapterId }) => {
      await queryClient.cancelQueries({ queryKey: SUBJECTS_SIDEBAR_QUERY_KEY });
      const previous = queryClient.getQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY
      );
      queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY,
        (prev) => removeNoteFromChapter(prev, chapterId, noteId)
      );
      const openNote = parseNoteCuidFromPathname(pathname);
      if (openNote === noteId) {
        router.replace("/dashboard");
        closeMobileSidebar();
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(SUBJECTS_SIDEBAR_QUERY_KEY, ctx.previous);
      }
    },
  });

  const onRequestDelete = useCallback(
    (args: {
      kind: "subject" | "note";
      entityId: string;
      chapterId?: string;
      label: string;
    }) => {
      setRenameTarget((r) =>
        r?.entityId === args.entityId && r.kind === args.kind ? null : r
      );
      setDeleteTarget({
        kind: args.kind,
        entityId: args.entityId,
        chapterId: args.chapterId,
        label: args.label,
      });
    },
    []
  );

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const next = deleteTarget;
    setDeleteTarget(null);
    if (next.kind === "subject") {
      deleteSubjectMutation.mutate(next.entityId);
    } else if (next.chapterId) {
      deleteNoteMutation.mutate({
        noteId: next.entityId,
        chapterId: next.chapterId,
      });
    }
  }, [deleteTarget, deleteNoteMutation, deleteSubjectMutation]);

  const isLoading = fetchEnabled && subjectsQuery.isLoading;
  const isError = fetchEnabled && subjectsQuery.isError;
  const refetch = subjectsQuery.refetch;

  const createNoteMutation = useCreateNoteInChapter();
  const createChapterMutation = useCreateChapterInSubject();

  const onCreateChapterNote = fetchEnabled
    ? async (ctx: {
        subjectId: string;
        chapterId: string;
        title?: string;
      }) => {
        await createNoteMutation.mutateAsync(ctx);
      }
    : undefined;
  const onCreateSubjectNote = fetchEnabled
    ? async (ctx: { subjectId: string; title?: string }) => {
        await createNoteMutation.mutateAsync({
          subjectId: ctx.subjectId,
          fromSubjectRow: true,
          title: ctx.title,
        });
      }
    : undefined;
  const onCreateChapter = fetchEnabled
    ? async (ctx: { subjectId: string; title: string }) => {
        await createChapterMutation.mutateAsync(ctx);
      }
    : undefined;

  const pendingNoteVars = fetchEnabled ? createNoteMutation.variables : undefined;
  const creatingChapterId =
    createNoteMutation.isPending &&
    pendingNoteVars &&
    "chapterId" in pendingNoteVars
      ? pendingNoteVars.chapterId
      : null;
  const creatingSubjectId =
    createNoteMutation.isPending &&
    pendingNoteVars &&
    "fromSubjectRow" in pendingNoteVars &&
    pendingNoteVars.fromSubjectRow
      ? pendingNoteVars.subjectId
      : null;
  const creatingChapterSubjectId =
    fetchEnabled && createChapterMutation.isPending
      ? createChapterMutation.variables?.subjectId ?? null
      : null;

  const [newSubjectOpen, setNewSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  const createSubjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        throw new Error("Name is required");
      }
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const err = data as { error?: string } | null;
        throw new Error(
          typeof err?.error === "string" ? err.error : "Failed to create subject"
        );
      }
      return data;
    },
    onSuccess: (data) => {
      const created = data as SubjectWithChaptersAndNotes;
      queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY,
        (previous) => {
          if (!previous?.length) return [created];
          if (previous.some((s) => s.id === created.id)) return previous;
          return [...previous, created];
        }
      );
      setNewSubjectOpen(false);
      setNewSubjectName("");
    },
  });

  const submitNewSubject = useCallback(() => {
    const n = newSubjectName.trim();
    if (!n) return;
    createSubjectMutation.mutate(n);
  }, [createSubjectMutation, newSubjectName]);

  const cancelNewSubject = useCallback(() => {
    setNewSubjectOpen(false);
    setNewSubjectName("");
  }, []);

  useEffect(() => {
    const onOpenNewSubject = () => {
      setNewSubjectName("");
      setNewSubjectOpen(true);
    };
    window.addEventListener(WE_OPEN_NEW_SUBJECT_EVENT, onOpenNewSubject);
    return () =>
      window.removeEventListener(WE_OPEN_NEW_SUBJECT_EVENT, onOpenNewSubject);
  }, []);

  const rawNoteCuid = useMemo(
    () => parseNoteCuidFromPathname(pathname),
    [pathname]
  );
  const activeNoteNodeId = rawNoteCuid ? `note:${rawNoteCuid}` : null;

  const ancestorOpenIds = useMemo(() => {
    if (!rawNoteCuid) return new Set<string>();
    return getAncestorBranchIdsForNoteId(rawNoteCuid, tree);
  }, [rawNoteCuid, tree]);

  const [openOverrides, setOpenOverrides] = useState<Record<string, boolean>>(
    {}
  );

  const isOpen = useCallback(
    (id: string, depth: number) => {
      if (ancestorOpenIds.has(id)) return true;
      if (openOverrides[id] !== undefined) return openOverrides[id]!;
      return depth < 1;
    },
    [ancestorOpenIds, openOverrides]
  );

  const setOpen = useCallback((id: string, open: boolean) => {
    setOpenOverrides((prev) => ({ ...prev, [id]: open }));
  }, []);

  const [collapsed, setCollapsed] = useState(false);
  const showCollapsed = collapsed && isMd;
  const [width, setWidth] = useState(DEFAULT_W);
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startW = useRef(0);

  useEffect(() => {
    try {
      const w = localStorage.getItem(STORAGE_WIDTH);
      const c = localStorage.getItem(STORAGE_COLLAPSED);
      if (w) {
        const parsed = parseInt(w, 10);
        if (!Number.isNaN(parsed)) setWidth(clamp(parsed, MIN_W, MAX_W));
      }
      if (c === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WIDTH, String(width));
    } catch {
      /* ignore */
    }
  }, [width]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_COLLAPSED, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const onResizeMove = useCallback((e: MouseEvent) => {
    const delta = e.clientX - startX.current;
    setWidth(clamp(startW.current + delta, MIN_W, MAX_W));
  }, []);

  const onResizeEnd = useCallback(() => {
    setIsResizing(false);
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("mouseup", onResizeEnd);
  }, [onResizeMove]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (collapsed || !isMd) return;
      e.preventDefault();
      setIsResizing(true);
      startX.current = e.clientX;
      startW.current = width;
      window.addEventListener("mousemove", onResizeMove);
      window.addEventListener("mouseup", onResizeEnd);
    },
    [collapsed, isMd, width, onResizeMove, onResizeEnd]
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onResizeMove);
      window.removeEventListener("mouseup", onResizeEnd);
    };
  }, [onResizeMove, onResizeEnd]);

  const effectiveWidth = collapsed ? COLLAPSED_W : width;
  const styleWidth = isMd ? effectiveWidth : undefined;

  return (
    <>
    <aside
      id="app-sidebar-nav"
      className={cn(
        "group relative flex shrink-0 flex-col overflow-x-hidden border-r border-zinc-200/70 bg-white/70 backdrop-blur-xl dark:border-zinc-700/70 dark:bg-zinc-950/45 md:shadow-[2px_0_24px_-12px_rgba(45,70,140,0.16)] dark:md:shadow-[2px_0_32px_-14px_rgba(60,35,120,0.55)]",
        !isMd &&
          "fixed left-0 top-14 z-50 h-[calc(100dvh-3.5rem)] w-[min(19rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] shadow-xl",
        !isMd &&
          (mobileOpen
            ? "translate-x-0"
            : "-translate-x-full pointer-events-none"),
        "md:static md:z-auto md:h-auto md:max-h-none md:w-auto md:max-w-none md:translate-x-0 md:pointer-events-auto md:shadow-none",
        !isResizing && isMd && MOTION_SIDEBAR_LAYOUT,
        !isResizing && !isMd && MOTION_SIDEBAR_DRAWER
      )}
      style={{ width: styleWidth }}
      aria-label="Main navigation"
      aria-hidden={!isMd && !mobileOpen ? true : undefined}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-11 shrink-0 items-center border-b border-zinc-200/80 px-3 dark:border-zinc-700/70 md:bg-zinc-100/35 dark:md:bg-zinc-900/45">
          {!showCollapsed && (
            <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-400">
              Workspace
            </span>
          )}
        </div>

        <nav
          className="flex min-h-0 flex-1 flex-col overflow-hidden px-2.5 py-2.5"
          aria-label="App navigation"
          onClick={(e) => {
            if (
              !isMd &&
              e.target instanceof HTMLElement &&
              e.target.closest("a[href]")
            ) {
              closeMobileSidebar();
            }
          }}
        >
          <ul className="shrink-0 space-y-1">
            {quickLinks.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={showCollapsed ? label : undefined}
                    className={cn(
                      sidebarRowClass({ active }),
                      sidebarIndentClass(0),
                      showCollapsed &&
                        "justify-center gap-0 border-l-0 px-1.5 py-2.5"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0 opacity-85" />
                    {!showCollapsed && (
                      <span className="truncate">{label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="my-3 shrink-0 border-t border-zinc-200/80 dark:border-zinc-800" />

          {!showCollapsed && favoriteRows.length > 0 ? (
            <div className="mb-3 shrink-0 px-1">
              <h2 className="mb-1.5 truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-400">
                Favorites
              </h2>
              <ul className="space-y-0.5" role="list">
                {favoriteRows.map((row) => {
                  const Icon = row.kind === "subject" ? Library : StickyNote;
                  const favActive =
                    row.href != null &&
                    (pathname === row.href ||
                      pathname.startsWith(`${row.href}/`));
                  const rowClass = cn(
                    sidebarRowClass({ active: favActive }),
                    sidebarIndentClass(0),
                    "ring-1 ring-inset ring-amber-200/45 dark:ring-amber-500/25"
                  );
                  return (
                    <li key={`${row.kind}:${row.id}`}>
                      {row.href ? (
                        <Link href={row.href} className={rowClass} title={row.title}>
                          <Icon
                            className="h-[15px] w-[15px] shrink-0 text-amber-600/90 dark:text-amber-400/90"
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {row.title}
                          </span>
                        </Link>
                      ) : (
                        <span
                          className={cn(
                            rowClass,
                            "cursor-default opacity-80 hover:!bg-transparent dark:hover:!bg-transparent"
                          )}
                          title="No notes in this subject yet"
                        >
                          <Icon
                            className="h-[15px] w-[15px] shrink-0 text-amber-600/70 dark:text-amber-500/70"
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 truncate">{row.title}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {!showCollapsed && favoriteRows.length > 0 ? (
            <div className="mb-3 shrink-0 border-t border-zinc-200/80 dark:border-zinc-800" />
          ) : null}

          <SidebarTrashSection showCollapsed={showCollapsed} />
          <div className="mb-3 shrink-0 border-t border-zinc-200/80 dark:border-zinc-800" />

          {!showCollapsed && (
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <h2 className="truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-400">
                Notebook
              </h2>
            </div>
          )}

          {!showCollapsed && tree.length > 0 ? (
            <div className="mb-2 shrink-0 px-1">
              {newSubjectOpen ? (
                <InlineCreateField
                  key="sidebar-new-subject"
                  value={newSubjectName}
                  onChange={setNewSubjectName}
                  onSubmit={submitNewSubject}
                  onCancel={cancelNewSubject}
                  placeholder="Subject name"
                  disabled={createSubjectMutation.isPending}
                />
              ) : (
                <button
                  type="button"
                  className={newSubjectTriggerClass}
                  onClick={() => {
                    setNewSubjectName("");
                    setNewSubjectOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  New subject
                </button>
              )}
              {createSubjectMutation.isError ? (
                <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                  {createSubjectMutation.error.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {showCollapsed ? (
              <div className="flex justify-center py-2" aria-hidden>
                <span className="h-4 w-4 rounded-sm bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ) : isLoading ? (
              <div
                className="space-y-3 px-1 py-1 pr-2"
                aria-busy
                aria-label="Loading notebook"
              >
                <Skeleton className="h-5 w-[52%]" />
                {[0, 1, 2].map((block) => (
                  <div key={block} className="space-y-2">
                    <Skeleton className="h-7 w-full rounded-md" />
                    <div className="space-y-1.5 border-l border-zinc-200/60 pl-2.5 dark:border-zinc-800/60">
                      <Skeleton
                        className="h-6 w-[94%] rounded-md"
                        style={{ marginLeft: block === 0 ? 0 : 4 }}
                      />
                      <Skeleton className="h-6 w-[82%] rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="px-2 py-2">
                <p className="text-[13px] text-red-600 dark:text-red-400">
                  Could not load notebook.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => void refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : tree.length === 0 ? (
              <EmptyState
                size="compact"
                className="border-zinc-200/60 dark:border-zinc-800/60"
                illustration={
                  <IllustrationEmptyWorkspace className="mx-auto h-[6.5rem] w-auto max-w-[180px]" />
                }
                title="Start by creating your first subject"
                description="Add chapters and notes inside each subject. Your workspace syncs across devices."
              >
                {fetchEnabled ? (
                  <div className="w-full max-w-[16rem]">
                    {newSubjectOpen ? (
                      <InlineCreateField
                        key="empty-tree-new-subject"
                        value={newSubjectName}
                        onChange={setNewSubjectName}
                        onSubmit={submitNewSubject}
                        onCancel={cancelNewSubject}
                        placeholder="Subject name"
                        disabled={createSubjectMutation.isPending}
                      />
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-zinc-200/90 bg-white/90 text-[13px] text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        onClick={() => {
                          setNewSubjectName("");
                          setNewSubjectOpen(true);
                        }}
                      >
                        <Plus
                          className="h-3.5 w-3.5 shrink-0 opacity-70"
                          aria-hidden
                        />
                        New subject
                      </Button>
                    )}
                    {createSubjectMutation.isError ? (
                      <p className="mt-2 text-left text-[11px] text-red-600 dark:text-red-400">
                        {createSubjectMutation.error.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </EmptyState>
            ) : (
              <ScrollArea className="h-full min-h-[120px] max-h-[calc(100dvh-11rem)] md:max-h-[min(360px,calc(100vh-12rem))]">
                {fetchEnabled ? (
                  <NotebookDndTree
                    nodes={tree}
                    pathname={pathname}
                    activeNoteNodeId={activeNoteNodeId}
                    ancestorOpenIds={ancestorOpenIds}
                    isOpen={isOpen}
                    setOpen={setOpen}
                    onCreateChapterNote={onCreateChapterNote}
                    onCreateSubjectNote={onCreateSubjectNote}
                    onCreateChapter={onCreateChapter}
                    creatingChapterId={creatingChapterId}
                    creatingChapterSubjectId={creatingChapterSubjectId}
                    creatingSubjectId={creatingSubjectId}
                    onToggleFavorite={fetchEnabled ? onToggleFavorite : undefined}
                    sidebarRename={sidebarRename}
                    onRequestSidebarRename={
                      fetchEnabled ? onRequestSidebarRename : undefined
                    }
                    onRequestDelete={
                      fetchEnabled ? onRequestDelete : undefined
                    }
                  />
                ) : (
                  <ul className="space-y-0.5 pb-3 pr-2" role="tree">
                    {tree.map((node) => (
                      <TreeNode
                        key={node.id}
                        node={node}
                        depth={0}
                        pathname={pathname}
                        activeNoteNodeId={activeNoteNodeId}
                        ancestorOpenIds={ancestorOpenIds}
                        isOpen={isOpen}
                        setOpen={setOpen}
                        onCreateChapterNote={onCreateChapterNote}
                        onCreateSubjectNote={onCreateSubjectNote}
                        onCreateChapter={onCreateChapter}
                        creatingChapterId={creatingChapterId}
                        creatingChapterSubjectId={creatingChapterSubjectId}
                        creatingSubjectId={creatingSubjectId}
                        onToggleFavorite={
                          fetchEnabled ? onToggleFavorite : undefined
                        }
                        sidebarRename={sidebarRename}
                        onRequestSidebarRename={
                          fetchEnabled ? onRequestSidebarRename : undefined
                        }
                        onRequestDelete={
                          fetchEnabled ? onRequestDelete : undefined
                        }
                      />
                    ))}
                  </ul>
                )}
              </ScrollArea>
            )}
          </div>
        </nav>

        {isMd ? (
          <div className="shrink-0 border-t border-zinc-200/80 p-2 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className={cn(
                "flex min-h-[44px] w-full items-center rounded-md py-2 text-xs font-medium text-zinc-500 transition-[background-color,color] duration-200 ease-out hover:bg-zinc-200/65 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 xl:min-h-0",
                collapsed
                  ? "justify-center"
                  : "justify-center gap-2"
              )}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" aria-hidden />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Collapse</span>
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {!collapsed && isMd && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onMouseDown={onResizeStart}
          title="Drag to resize"
          className="absolute right-0 top-0 z-10 flex h-full w-3 cursor-col-resize select-none items-center justify-center opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-70"
        >
            <span className="flex h-24 w-3 items-center justify-center rounded-l border border-zinc-200/80 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/90">
            <GripVertical className="h-4 w-4 text-zinc-400 dark:text-zinc-400" />
          </span>
        </div>
      )}
    </aside>

    <AlertDialog
      open={deleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) setDeleteTarget(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deleteTarget?.kind === "subject"
              ? "Move subject to Trash?"
              : "Move note to Trash?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deleteTarget?.kind === "subject" ? (
              <>
                Move{" "}
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {deleteTarget.label}
                </span>{" "}
                and everything inside it to Trash. You can restore from Trash
                later.
              </>
            ) : deleteTarget ? (
              <>
                Move{" "}
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {deleteTarget.label}
                </span>{" "}
                to Trash? You can restore it from Trash later.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
          <Button
            type="button"
            className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700"
            onClick={() => confirmDelete()}
          >
            Move to Trash
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
