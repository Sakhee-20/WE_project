"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DraggableSyntheticListeners,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  defaultAnimateLayoutChanges,
  useSortable,
  verticalListSortingStrategy,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  ChevronRight,
  GripVertical,
  Library,
  StickyNote,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { applyWorkspaceDrag } from "@/lib/workspace-drag";
import { subjectsToWorkspaceLayout } from "@/lib/workspace-layout-serialize";
import type { SubjectWithChaptersAndNotes } from "@/lib/subjects-tree";
import { cn } from "@/lib/utils";
import type {
  ChapterSidebarTreeNode,
  NoteSidebarTreeNode,
  SidebarTreeNodeKind,
  SubjectSidebarTreeNode,
} from "./types";
import { SUBJECTS_SIDEBAR_QUERY_KEY } from "./subjects-sidebar-query";
import { InlineCreateField } from "./InlineCreateField";
import {
  sidebarIndentClass,
  sidebarRowClass,
  sidebarTreeRowMainClass,
  sidebarTreeRowShellClass,
} from "./sidebar-item-styles";
import { SidebarItemMoreMenu } from "./SidebarItemMoreMenu";
import type { TreeNodeProps } from "./TreeNode";
import { findSidebarDragLabel } from "./tree-utils";

const SORTABLE_TRANSITION = {
  duration: 220,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
} as const;

const sortableAnimateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

const inlineTriggerClass =
  "w-full rounded-md py-1 text-left text-[12px] text-zinc-500 transition-[background-color,color] duration-200 ease-out hover:bg-zinc-200/50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100";

const KIND_ICONS: Record<SidebarTreeNodeKind, LucideIcon> = {
  subject: Library,
  chapter: BookMarked,
  note: StickyNote,
};

type TreeShared = Pick<
  TreeNodeProps,
  | "pathname"
  | "activeNoteNodeId"
  | "ancestorOpenIds"
  | "isOpen"
  | "setOpen"
  | "onLeafClick"
  | "onCreateChapterNote"
  | "onCreateSubjectNote"
  | "onCreateChapter"
  | "creatingChapterId"
  | "creatingChapterSubjectId"
  | "creatingSubjectId"
  | "onToggleFavorite"
  | "sidebarRename"
  | "onRequestSidebarRename"
  | "onRequestDelete"
>;

type DndShared = TreeShared & {
  /** dnd-kit collision target id (e.g. `subject:…`, `chapter:…`, `note:…`). */
  dropTargetId: string | null;
};

const dropTargetRowClass = (isTarget: boolean) =>
  cn(
    "rounded-md p-0.5 -m-0.5 transition-[box-shadow,background-color] duration-200 ease-out",
    isTarget &&
      "bg-zinc-200/80 ring-2 ring-zinc-400/50 ring-offset-1 ring-offset-[#fbfbfa] dark:bg-zinc-800/75 dark:ring-zinc-500/45 dark:ring-offset-zinc-950"
  );

export type NotebookDndTreeProps = TreeShared & {
  nodes: SubjectSidebarTreeNode[];
};

export function NotebookDndTree(props: NotebookDndTreeProps) {
  const { nodes, ...shared } = props;
  const queryClient = useQueryClient();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overTargetId, setOverTargetId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setOverTargetId(null);
  }, []);

  const onDragOver = useCallback((event: DragOverEvent) => {
    const id = event.over?.id;
    setOverTargetId(id != null ? String(id) : null);
  }, []);

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDragId(null);
      setOverTargetId(null);
      const { active, over } = event;
      if (!over) return;
      const current = queryClient.getQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY
      );
      const next = applyWorkspaceDrag(
        current,
        String(active.id),
        String(over.id)
      );
      if (!next) return;

      const previous = queryClient.getQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY
      );
      queryClient.setQueryData(SUBJECTS_SIDEBAR_QUERY_KEY, next);

      try {
        const res = await fetch("/api/workspace/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subjectsToWorkspaceLayout(next)),
        });
        if (!res.ok) throw new Error("layout rejected");
        const fresh = (await res.json()) as SubjectWithChaptersAndNotes[];
        queryClient.setQueryData(SUBJECTS_SIDEBAR_QUERY_KEY, fresh);
      } catch {
        if (previous !== undefined) {
          queryClient.setQueryData(SUBJECTS_SIDEBAR_QUERY_KEY, previous);
        }
      }
    },
    [queryClient]
  );

  const onDragCancel = useCallback(() => {
    setActiveDragId(null);
    setOverTargetId(null);
  }, []);

  const subjectIds = nodes.map((n) => n.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={(e) => void onDragEnd(e)}
      onDragCancel={onDragCancel}
    >
      <SortableContext items={subjectIds} strategy={verticalListSortingStrategy}>
        <ul className="space-y-0.5 pb-2 pr-3" role="tree">
          {nodes.map((node) => (
            <DndSubjectNode
              key={node.id}
              node={node}
              depth={0}
              {...shared}
              dropTargetId={overTargetId}
            />
          ))}
        </ul>
      </SortableContext>
      <DragOverlay
        zIndex={200}
        dropAnimation={{
          duration: 280,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        }}
        className="pointer-events-none"
      >
        {activeDragId ? (
          <div className="flex max-w-[min(280px,calc(100vw-24px))] cursor-grabbing items-center gap-2.5 rounded-xl border border-zinc-200/95 bg-white px-3.5 py-2.5 text-[13px] font-medium text-zinc-800 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.35)] ring-1 ring-zinc-900/[0.06] backdrop-blur-md transition-[box-shadow,transform] duration-150 ease-out dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/10">
            <GripVertical
              className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
              aria-hidden
            />
            <span className="truncate">
              {findSidebarDragLabel(nodes, activeDragId)}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DragHandle({
  listeners,
  label,
}: {
  listeners: DraggableSyntheticListeners | undefined;
  label: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "touch-none rounded-md p-0.5 text-zinc-400 transition-[background-color,color] duration-200 ease-out hover:bg-zinc-200/85 hover:text-zinc-700",
        "dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      )}
      aria-label={label}
      {...listeners}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0" aria-hidden />
    </button>
  );
}

function DndSubjectNode({
  node,
  depth,
  dropTargetId,
  ...shared
}: DndShared & { node: SubjectSidebarTreeNode; depth: number }) {
  const isDropTarget = dropTargetId === node.id;
  const [subjectInline, setSubjectInline] = useState<
    null | "chapter" | "note"
  >(null);
  const [subjectDraft, setSubjectDraft] = useState("");

  const mustStayOpen = shared.ancestorOpenIds.has(node.id);
  const open = shared.isOpen(node.id, depth);
  const children = node.children ?? [];
  const chapterIds = children.map((c) => c.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    transition: SORTABLE_TRANSITION,
    animateLayoutChanges: sortableAnimateLayoutChanges,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.35 : undefined,
  };

  const SubjectIcon = KIND_ICONS.subject;
  const subjectName = node.name;
  const subjectFavorited = Boolean(node.isFavorite);
  const isRenaming = shared.sidebarRename?.treeNodeId === node.id;
  const canRename =
    !!shared.onRequestSidebarRename && !!node.subjectId;
  const canDeleteSubject =
    !!shared.onRequestDelete && !!node.subjectId;
  const canChapter = !!shared.onCreateChapter && !!node.subjectId;
  const canNote = !!shared.onCreateSubjectNote && !!node.subjectId;
  const subjectNoteBusy = shared.creatingSubjectId === node.subjectId;
  const chapterBusy = shared.creatingChapterSubjectId === node.subjectId;

  const cancelInline = () => {
    setSubjectInline(null);
    setSubjectDraft("");
  };

  const submitChapter = async () => {
    if (!shared.onCreateChapter || !node.subjectId) return;
    try {
      await shared.onCreateChapter({
        subjectId: node.subjectId,
        title: subjectDraft,
      });
      cancelInline();
    } catch {
      /* react-query surfaces error */
    }
  };

  const submitNote = async () => {
    if (!shared.onCreateSubjectNote || !node.subjectId) return;
    try {
      await shared.onCreateSubjectNote({
        subjectId: node.subjectId,
        title: subjectDraft,
      });
      cancelInline();
    } catch {
      /* react-query surfaces error */
    }
  };

  const actionsBlock =
    canChapter || canNote ? (
      <div className="mt-0.5 space-y-1 border-l border-zinc-100 py-0.5 pl-1.5 ml-[11px] dark:border-zinc-800">
        {canChapter ? (
          subjectInline === "chapter" ? (
            <InlineCreateField
              key={`${node.id}-ch`}
              value={subjectDraft}
              onChange={setSubjectDraft}
              onSubmit={() => void submitChapter()}
              onCancel={cancelInline}
              placeholder="Chapter name"
              disabled={chapterBusy}
            />
          ) : (
            <button
              type="button"
              className={inlineTriggerClass}
              disabled={chapterBusy}
              onClick={() => {
                setSubjectDraft("");
                setSubjectInline("chapter");
              }}
            >
              + New chapter
            </button>
          )
        ) : null}
        {canNote ? (
          subjectInline === "note" ? (
            <InlineCreateField
              key={`${node.id}-note`}
              value={subjectDraft}
              onChange={setSubjectDraft}
              onSubmit={() => void submitNote()}
              onCancel={cancelInline}
              placeholder="Note title"
              disabled={subjectNoteBusy}
            />
          ) : (
            <button
              type="button"
              className={inlineTriggerClass}
              disabled={subjectNoteBusy}
              onClick={() => {
                setSubjectDraft("");
                setSubjectInline("note");
              }}
            >
              + New note
            </button>
          )
        ) : null}
      </div>
    ) : null;

  const childList = (
    <ul
      className="mt-0.5 space-y-0.5 border-l border-zinc-100 pl-1.5 ml-[11px] dark:border-zinc-800"
      role="group"
    >
      {children.length === 0 ? (
        <li
          className={cn(
            "rounded-lg py-2 pl-1 text-[12px] text-zinc-400/90 dark:text-zinc-500",
            sidebarIndentClass(depth + 1)
          )}
          role="none"
        >
          No chapters yet
        </li>
      ) : (
        <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
          {children.map((child) => (
            <DndChapterNode
              key={child.id}
              node={child}
              depth={depth + 1}
              dropTargetId={dropTargetId}
              {...shared}
            />
          ))}
        </SortableContext>
      )}
    </ul>
  );

  return (
    <li ref={setNodeRef} style={style} {...attributes} role="none" className="list-none">
      <Collapsible
        open={open}
        onOpenChange={(next) => {
          if (mustStayOpen && !next) return;
          shared.setOpen(node.id, next);
        }}
      >
        <div
          className={cn(
            "flex min-w-0 items-center gap-0.5",
            sidebarIndentClass(depth),
            dropTargetRowClass(isDropTarget)
          )}
        >
          <DragHandle listeners={listeners} label={`Reorder ${subjectName}`} />
          <div
            className={cn(
              sidebarTreeRowShellClass({
                active: false,
                favorited: subjectFavorited,
              }),
              "min-w-0 flex-1"
            )}
          >
            {isRenaming && shared.sidebarRename ? (
              <div
                className={cn(
                  sidebarTreeRowMainClass({
                    active: false,
                    favorited: subjectFavorited,
                  }),
                  "flex min-w-0 flex-1 items-center gap-1.5 py-[5px] pl-2.5 pr-1"
                )}
              >
                <CollapsibleTrigger
                  type="button"
                  className="flex h-7 w-4 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                  aria-expanded={open}
                >
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200 ease-out",
                      open && "rotate-90"
                    )}
                    aria-hidden
                  />
                </CollapsibleTrigger>
                <SubjectIcon
                  className="h-[15px] w-[15px] shrink-0 text-amber-600/90 dark:text-amber-500/85"
                  aria-hidden
                />
                <div
                  className="min-w-0 flex-1"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <InlineCreateField
                    key={`rename-${node.id}`}
                    value={shared.sidebarRename.value}
                    onChange={shared.sidebarRename.onChange}
                    onSubmit={shared.sidebarRename.onSave}
                    onCancel={shared.sidebarRename.onCancel}
                    placeholder="Subject name"
                    pending={shared.sidebarRename.isPending}
                  />
                </div>
              </div>
            ) : (
              <CollapsibleTrigger
                type="button"
                className={cn(
                  sidebarTreeRowMainClass({
                    active: false,
                    favorited: subjectFavorited,
                  }),
                  "w-full min-w-0 flex-1 [&[data-state=open]>svg:first-of-type]:rotate-90"
                )}
              >
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 ease-out"
                  aria-hidden
                />
                <SubjectIcon
                  className="h-[15px] w-[15px] shrink-0 text-amber-600/90 dark:text-amber-500/85"
                  aria-hidden
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-left font-medium",
                    subjectFavorited
                      ? "text-amber-950 dark:text-amber-100"
                      : "text-zinc-800 dark:text-zinc-100"
                  )}
                >
                  {subjectName}
                </span>
              </CollapsibleTrigger>
            )}
            {!isRenaming ? (
              <SidebarItemMoreMenu
                label={subjectName}
                isFavorite={
                  shared.onToggleFavorite ? subjectFavorited : undefined
                }
                onFavoriteToggle={
                  shared.onToggleFavorite && node.subjectId
                    ? () =>
                        shared.onToggleFavorite!({
                          kind: "subject",
                          id: node.subjectId,
                        })
                    : undefined
                }
                onRename={
                  canRename && node.subjectId
                    ? () =>
                        shared.onRequestSidebarRename!({
                          treeNodeId: node.id,
                          kind: "subject",
                          entityId: node.subjectId,
                          currentTitle: subjectName,
                        })
                    : undefined
                }
                onDelete={
                  canDeleteSubject && node.subjectId
                    ? () =>
                        shared.onRequestDelete!({
                          kind: "subject",
                          entityId: node.subjectId,
                          label: subjectName,
                        })
                    : undefined
                }
              />
            ) : null}
          </div>
        </div>
        <CollapsibleContent>
          {actionsBlock}
          {childList}
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

function DndChapterNode({
  node,
  depth,
  dropTargetId,
  ...shared
}: DndShared & { node: ChapterSidebarTreeNode; depth: number }) {
  const isDropTarget = dropTargetId === node.id;
  const [noteInlineOpen, setNoteInlineOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const mustStayOpen = shared.ancestorOpenIds.has(node.id);
  const open = shared.isOpen(node.id, depth);
  const children = node.children ?? [];
  const noteIds = children.map((n) => n.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    transition: SORTABLE_TRANSITION,
    animateLayoutChanges: sortableAnimateLayoutChanges,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.35 : undefined,
  };

  const Icon = KIND_ICONS.chapter;
  const canCreate =
    !!shared.onCreateChapterNote &&
    !!node.subjectId &&
    !!node.chapterId &&
    node.kind === "chapter";
  const busy = !!node.chapterId && shared.creatingChapterId === node.chapterId;

  const cancelNote = () => {
    setNoteInlineOpen(false);
    setNoteDraft("");
  };

  const submitNote = async () => {
    if (!shared.onCreateChapterNote || !node.subjectId || !node.chapterId) {
      return;
    }
    try {
      await shared.onCreateChapterNote({
        subjectId: node.subjectId,
        chapterId: node.chapterId,
        title: noteDraft,
      });
      cancelNote();
    } catch {
      /* react-query surfaces error */
    }
  };

  const childList = (
    <ul
      className="mt-0.5 space-y-0.5 border-l border-zinc-100 pl-1.5 ml-[11px] dark:border-zinc-800"
      role="group"
    >
      {children.length === 0 ? (
        <li
          className={cn(
            "rounded-lg py-2 pl-1 text-[12px] text-zinc-400/90 dark:text-zinc-500",
            sidebarIndentClass(depth + 1)
          )}
          role="none"
        >
          No notes yet
        </li>
      ) : (
        <SortableContext items={noteIds} strategy={verticalListSortingStrategy}>
          {children.map((child) => (
            <DndNoteNode
              key={child.id}
              node={child}
              depth={depth + 1}
              dropTargetId={dropTargetId}
              {...shared}
            />
          ))}
        </SortableContext>
      )}
    </ul>
  );

  return (
    <li ref={setNodeRef} style={style} {...attributes} role="none" className="list-none">
      <Collapsible
        open={open}
        onOpenChange={(next) => {
          if (mustStayOpen && !next) return;
          shared.setOpen(node.id, next);
        }}
      >
        <div
          className={cn(
            "flex min-w-0 flex-col gap-0.5",
            sidebarIndentClass(depth)
          )}
        >
          <div
            className={cn(
              "flex min-w-0 items-center gap-0.5",
              dropTargetRowClass(isDropTarget)
            )}
          >
            <DragHandle listeners={listeners} label={`Reorder ${node.title}`} />
            <div
              className={cn(
                sidebarTreeRowShellClass({ active: false }),
                "min-w-0 flex-1"
              )}
            >
              <CollapsibleTrigger
                type="button"
                className={cn(
                  sidebarTreeRowMainClass({ active: false }),
                  "w-full min-w-0 flex-1 [&[data-state=open]>svg:first-of-type]:rotate-90"
                )}
              >
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 ease-out"
                  aria-hidden
                />
                <Icon
                  className="h-[15px] w-[15px] shrink-0 text-sky-600/85 dark:text-sky-400/85"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-left text-zinc-700 dark:text-zinc-200">
                  {node.title}
                </span>
              </CollapsibleTrigger>
              <SidebarItemMoreMenu label={node.title} />
            </div>
          </div>
          {canCreate ? (
            noteInlineOpen ? (
              <div className="pl-6 pr-1">
                <InlineCreateField
                  key={`${node.id}-new-note`}
                  value={noteDraft}
                  onChange={setNoteDraft}
                  onSubmit={() => void submitNote()}
                  onCancel={cancelNote}
                  placeholder="Note title"
                  disabled={busy}
                />
              </div>
            ) : (
              <button
                type="button"
                className={cn(inlineTriggerClass, "pl-6")}
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setNoteDraft("");
                  setNoteInlineOpen(true);
                }}
              >
                + New note
              </button>
            )
          ) : null}
        </div>
        <CollapsibleContent>{childList}</CollapsibleContent>
      </Collapsible>
    </li>
  );
}

function DndNoteNode({
  node,
  depth,
  dropTargetId,
  ...shared
}: DndShared & { node: NoteSidebarTreeNode; depth: number }) {
  const isDropTarget = dropTargetId === node.id;
  const Icon = KIND_ICONS.note;
  const optimistic = node.id.includes("optimistic:");
  const noteFavorited = Boolean(node.isFavorite);
  const rawNoteId = node.id.startsWith("note:") ? node.id.slice(5) : node.id;
  const canFavorite =
    !!shared.onToggleFavorite && !optimistic;
  const isRenaming = shared.sidebarRename?.treeNodeId === node.id;
  const canRename =
    !!shared.onRequestSidebarRename && !optimistic;
  const canDelete =
    !!shared.onRequestDelete && !optimistic;
  const active =
    shared.activeNoteNodeId === node.id ||
    (!!node.href && shared.pathname === node.href);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    disabled: optimistic,
    transition: SORTABLE_TRANSITION,
    animateLayoutChanges: sortableAnimateLayoutChanges,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.35 : undefined,
  };

  const rowShell = cn(
    sidebarIndentClass(depth),
    "flex min-w-0 items-center gap-0.5",
    dropTargetRowClass(isDropTarget),
    !node.href &&
      "cursor-default opacity-70 hover:!bg-transparent dark:hover:!bg-transparent"
  );

  if (node.href) {
    return (
      <li ref={setNodeRef} style={style} {...attributes} role="none" className="list-none">
        <div className={rowShell}>
          {!optimistic ? (
            <DragHandle listeners={listeners} label={`Reorder ${node.title}`} />
          ) : (
            <span className="w-5 shrink-0" aria-hidden />
          )}
          <div
            className={cn(
              sidebarTreeRowShellClass({ active, favorited: noteFavorited }),
              "min-w-0 flex-1"
            )}
          >
            {isRenaming && shared.sidebarRename ? (
              <div
                className={cn(
                  sidebarTreeRowMainClass({ active, favorited: noteFavorited }),
                  "min-w-0 flex-1 items-center gap-1.5 py-[5px] pl-2.5 pr-1"
                )}
              >
                <Icon
                  className="h-[15px] w-[15px] shrink-0 text-violet-500/90 dark:text-violet-400/90"
                  aria-hidden
                />
                <div
                  className="min-w-0 flex-1"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <InlineCreateField
                    key={`rename-${node.id}`}
                    value={shared.sidebarRename.value}
                    onChange={shared.sidebarRename.onChange}
                    onSubmit={shared.sidebarRename.onSave}
                    onCancel={shared.sidebarRename.onCancel}
                    placeholder="Note title"
                    pending={shared.sidebarRename.isPending}
                  />
                </div>
              </div>
            ) : (
              <Link
                href={node.href}
                className={cn(
                  sidebarTreeRowMainClass({ active, favorited: noteFavorited }),
                  "min-w-0 flex-1 gap-1.5"
                )}
                onClick={() => shared.onLeafClick?.(node)}
                title={node.title}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className="h-[15px] w-[15px] shrink-0 text-violet-500/90 dark:text-violet-400/90"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{node.title}</span>
              </Link>
            )}
            {!isRenaming ? (
              <SidebarItemMoreMenu
                href={node.href}
                label={node.title}
                isFavorite={canFavorite ? noteFavorited : undefined}
                onFavoriteToggle={
                  canFavorite
                    ? () =>
                        shared.onToggleFavorite!({
                          kind: "note",
                          id: rawNoteId,
                        })
                    : undefined
                }
                onRename={
                  canRename
                    ? () =>
                        shared.onRequestSidebarRename!({
                          treeNodeId: node.id,
                          kind: "note",
                          entityId: rawNoteId,
                          currentTitle: node.title,
                        })
                    : undefined
                }
                onDelete={
                  canDelete
                    ? () =>
                        shared.onRequestDelete!({
                          kind: "note",
                          entityId: rawNoteId,
                          chapterId: node.chapterId,
                          label: node.title,
                        })
                    : undefined
                }
              />
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li ref={setNodeRef} style={style} {...attributes} role="none" className="list-none">
      <span className={rowShell} title="No link">
        {!optimistic ? (
          <DragHandle listeners={listeners} label={`Reorder ${node.title}`} />
        ) : (
          <span className="w-5 shrink-0" aria-hidden />
        )}
        <span
          className={cn(
            sidebarRowClass({ active: false }),
            "min-w-0 flex-1"
          )}
        >
          <Icon
            className="h-[15px] w-[15px] shrink-0 text-zinc-400"
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate">{node.title}</span>
        </span>
      </span>
    </li>
  );
}
