"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BookMarked, ChevronRight, FileText, Library } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type {
  ChapterSidebarTreeNode,
  SidebarTreeNode,
  SidebarTreeNodeKind,
} from "./types";
import {
  sidebarRowClass,
  sidebarTreeRowMainClass,
  sidebarTreeRowShellClass,
} from "./sidebar-item-styles";
import { SidebarItemMoreMenu } from "./SidebarItemMoreMenu";
import { InlineCreateField } from "./InlineCreateField";

const NOTION_INDENT_PX = 14;
const NOTION_BASE_PX = 6;

const KIND_ICONS: Record<SidebarTreeNodeKind, LucideIcon> = {
  subject: Library,
  chapter: BookMarked,
  note: FileText,
};

const inlineTriggerClass =
  "w-full rounded-md py-1.5 pl-2 text-left text-[12px] text-zinc-500 transition-[background-color,color] duration-200 ease-out hover:bg-zinc-200/50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100";

/** Active inline rename session for one sidebar tree row (subjects and notes). */
export type SidebarRenameSession = {
  treeNodeId: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
};

export type TreeNodeProps = {
  node: SidebarTreeNode;
  depth: number;
  pathname: string;
  activeNoteNodeId: string | null;
  ancestorOpenIds: Set<string>;
  isOpen: (id: string, depth: number) => boolean;
  setOpen: (id: string, open: boolean) => void;
  onLeafClick?: (node: SidebarTreeNode) => void;
  onCreateChapterNote?: (ctx: {
    subjectId: string;
    chapterId: string;
    title?: string;
  }) => void | Promise<void>;
  onCreateSubjectNote?: (ctx: {
    subjectId: string;
    title?: string;
  }) => void | Promise<void>;
  onCreateChapter?: (ctx: {
    subjectId: string;
    title: string;
  }) => void | Promise<void>;
  creatingChapterId?: string | null;
  creatingChapterSubjectId?: string | null;
  creatingSubjectId?: string | null;
  onToggleFavorite?: (args: { kind: "subject" | "note"; id: string }) => void;
  sidebarRename?: SidebarRenameSession | null;
  onRequestSidebarRename?: (args: {
    treeNodeId: string;
    kind: "subject" | "note";
    entityId: string;
    currentTitle: string;
  }) => void;
  onRequestDelete?: (args: {
    kind: "subject" | "note";
    entityId: string;
    chapterId?: string;
    label: string;
  }) => void;
};

function rowPad(depth: number) {
  return { paddingLeft: NOTION_BASE_PX + depth * NOTION_INDENT_PX };
}

function subjectActionsMarginLeft(depth: number) {
  return NOTION_BASE_PX + depth * NOTION_INDENT_PX + 10;
}

export function TreeNode({
  node,
  depth,
  pathname,
  activeNoteNodeId,
  ancestorOpenIds,
  isOpen,
  setOpen,
  onLeafClick,
  onCreateChapterNote,
  onCreateSubjectNote,
  onCreateChapter,
  creatingChapterId,
  creatingChapterSubjectId,
  creatingSubjectId,
  onToggleFavorite,
  sidebarRename,
  onRequestSidebarRename,
  onRequestDelete,
}: TreeNodeProps) {
  const mustStayOpen = ancestorOpenIds.has(node.id);

  if (node.kind === "note") {
    const Icon = KIND_ICONS[node.kind];
    const active =
      activeNoteNodeId !== null && activeNoteNodeId === node.id;
    const favorited = Boolean(node.isFavorite);
    const rawNoteId = node.id.startsWith("note:")
      ? node.id.slice(5)
      : node.id;
    const canFavorite =
      !!onToggleFavorite && !node.id.includes("optimistic:");
    const isRenaming = sidebarRename?.treeNodeId === node.id;
    const canRename =
      !!onRequestSidebarRename && !node.id.includes("optimistic:");
    const canDelete =
      !!onRequestDelete && !node.id.includes("optimistic:");

    if (node.href) {
      return (
        <li role="none">
          <div
            className={cn(sidebarTreeRowShellClass({ active, favorited }))}
            style={rowPad(depth)}
          >
            {isRenaming && sidebarRename ? (
              <div
                className={cn(
                  sidebarTreeRowMainClass({ active, favorited }),
                  "min-w-0 flex-1 items-center gap-1.5 py-[5px] pl-2.5 pr-1"
                )}
              >
                <span className="w-4 shrink-0" aria-hidden />
                <Icon
                  className="h-[15px] w-[15px] shrink-0 text-zinc-500 dark:text-zinc-400"
                  aria-hidden
                />
                <div
                  className="min-w-0 flex-1"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <InlineCreateField
                    key={`rename-${node.id}`}
                    value={sidebarRename.value}
                    onChange={sidebarRename.onChange}
                    onSubmit={sidebarRename.onSave}
                    onCancel={sidebarRename.onCancel}
                    placeholder="Note title"
                    pending={sidebarRename.isPending}
                  />
                </div>
              </div>
            ) : (
              <Link
                href={node.href}
                className={cn(
                  sidebarTreeRowMainClass({ active, favorited }),
                  "min-w-0 flex-1"
                )}
                onClick={() => onLeafClick?.(node)}
                title={node.title}
                aria-current={active ? "page" : undefined}
              >
                <span className="w-4 shrink-0" aria-hidden />
                <Icon
                  className="h-[15px] w-[15px] shrink-0 text-zinc-500 dark:text-zinc-400"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{node.title}</span>
              </Link>
            )}
            {!isRenaming ? (
              <SidebarItemMoreMenu
                href={node.href}
                label={node.title}
                isFavorite={canFavorite ? favorited : undefined}
                onFavoriteToggle={
                  canFavorite
                    ? () => onToggleFavorite!({ kind: "note", id: rawNoteId })
                    : undefined
                }
                onRename={
                  canRename
                    ? () =>
                        onRequestSidebarRename!({
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
                        onRequestDelete!({
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
        </li>
      );
    }

    const row = cn(
      sidebarRowClass({ active: false }),
      !node.href &&
        "cursor-default opacity-70 hover:!bg-transparent dark:hover:!bg-transparent"
    );

    return (
      <li role="none">
        <span className={row} style={rowPad(depth)} title="No link">
          <span className="w-4 shrink-0" aria-hidden />
          <Icon
            className="h-[15px] w-[15px] shrink-0 text-zinc-400"
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate">{node.title}</span>
        </span>
      </li>
    );
  }

  const children = node.children ?? [];
  const emptyHint =
    node.kind === "subject" ? "No chapters yet" : "No notes yet";
  const open = isOpen(node.id, depth);

  const childList = (
    <ul
      className="mt-0.5 space-y-0.5 border-l border-zinc-200/90 dark:border-zinc-700/90"
      style={{ marginLeft: NOTION_BASE_PX + depth * NOTION_INDENT_PX + 10 }}
      role="group"
    >
      {children.length === 0 ? (
        <li
          className="rounded-lg py-2 pl-2 pr-2 text-[12px] leading-relaxed text-zinc-400/90 dark:text-zinc-500"
          role="none"
        >
          {emptyHint}
        </li>
      ) : (
        children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            pathname={pathname}
            activeNoteNodeId={activeNoteNodeId}
            ancestorOpenIds={ancestorOpenIds}
            isOpen={isOpen}
            setOpen={setOpen}
            onLeafClick={onLeafClick}
            onCreateChapterNote={onCreateChapterNote}
            onCreateSubjectNote={onCreateSubjectNote}
            onCreateChapter={onCreateChapter}
            creatingChapterId={creatingChapterId}
            creatingChapterSubjectId={creatingChapterSubjectId}
            creatingSubjectId={creatingSubjectId}
            onToggleFavorite={onToggleFavorite}
            sidebarRename={sidebarRename}
            onRequestSidebarRename={onRequestSidebarRename}
          />
        ))
      )}
    </ul>
  );

  if (node.kind === "subject") {
    return (
      <SubjectBranch
        node={node}
        depth={depth}
        mustStayOpen={mustStayOpen}
        open={open}
        setOpen={setOpen}
        childList={childList}
        onCreateChapter={onCreateChapter}
        onCreateSubjectNote={onCreateSubjectNote}
        creatingChapterSubjectId={creatingChapterSubjectId}
        creatingSubjectId={creatingSubjectId}
        onToggleFavorite={onToggleFavorite}
        sidebarRename={sidebarRename}
        onRequestSidebarRename={onRequestSidebarRename}
        onRequestDelete={onRequestDelete}
      />
    );
  }

  return (
    <li role="none">
      <ChapterBranchRow
        depth={depth}
        mustStayOpen={mustStayOpen}
        open={open}
        node={node}
        onCreateChapterNote={onCreateChapterNote}
        creatingChapterId={creatingChapterId}
        onOpenChange={(next) => {
          if (mustStayOpen && !next) return;
          setOpen(node.id, next);
        }}
      >
        <CollapsibleContent>{childList}</CollapsibleContent>
      </ChapterBranchRow>
    </li>
  );
}

function SubjectBranch({
  node,
  depth,
  mustStayOpen,
  open,
  setOpen,
  childList,
  onCreateChapter,
  onCreateSubjectNote,
  creatingChapterSubjectId,
  creatingSubjectId,
  onToggleFavorite,
  sidebarRename,
  onRequestSidebarRename,
  onRequestDelete,
}: {
  node: Extract<SidebarTreeNode, { kind: "subject" }>;
  depth: number;
  mustStayOpen: boolean;
  open: boolean;
  setOpen: (id: string, open: boolean) => void;
  childList: ReactNode;
  onCreateChapter?: TreeNodeProps["onCreateChapter"];
  onCreateSubjectNote?: TreeNodeProps["onCreateSubjectNote"];
  creatingChapterSubjectId?: string | null;
  creatingSubjectId?: string | null;
  onToggleFavorite?: TreeNodeProps["onToggleFavorite"];
  sidebarRename?: TreeNodeProps["sidebarRename"];
  onRequestSidebarRename?: TreeNodeProps["onRequestSidebarRename"];
  onRequestDelete?: TreeNodeProps["onRequestDelete"];
}) {
  const [subjectInline, setSubjectInline] = useState<
    null | "chapter" | "note"
  >(null);
  const [subjectDraft, setSubjectDraft] = useState("");

  const SubjectIcon = KIND_ICONS.subject;
  const favorited = Boolean(node.isFavorite);
  const canChapter = !!onCreateChapter && !!node.subjectId;
  const canNote = !!onCreateSubjectNote && !!node.subjectId;
  const subjectNoteBusy = creatingSubjectId === node.subjectId;
  const chapterBusy = creatingChapterSubjectId === node.subjectId;
  const isRenaming = sidebarRename?.treeNodeId === node.id;
  const canRename =
    !!onRequestSidebarRename && !!node.subjectId;
  const canDeleteSubject =
    !!onRequestDelete && !!node.subjectId;

  const openChapterField = () => {
    setSubjectDraft("");
    setSubjectInline("chapter");
  };
  const openNoteField = () => {
    setSubjectDraft("");
    setSubjectInline("note");
  };
  const cancelInline = () => {
    setSubjectInline(null);
    setSubjectDraft("");
  };

  const submitChapter = async () => {
    if (!onCreateChapter || !node.subjectId) return;
    try {
      await onCreateChapter({ subjectId: node.subjectId, title: subjectDraft });
      cancelInline();
    } catch {
      /* react-query surfaces error */
    }
  };

  const submitNote = async () => {
    if (!onCreateSubjectNote || !node.subjectId) return;
    try {
      await onCreateSubjectNote({
        subjectId: node.subjectId,
        title: subjectDraft,
      });
      cancelInline();
    } catch {
      /* react-query surfaces error */
    }
  };

  const actionsBlock = canChapter || canNote ? (
    <div
      className="mt-0.5 space-y-1 border-l border-zinc-200/90 py-0.5 pl-2 dark:border-zinc-700/90"
      style={{ marginLeft: subjectActionsMarginLeft(depth) }}
    >
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
            onClick={openChapterField}
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
            onClick={openNoteField}
          >
            + New note
          </button>
        )
      ) : null}
    </div>
  ) : null;

  return (
    <li role="none">
      <Collapsible
        open={open}
        onOpenChange={(next) => {
          if (mustStayOpen && !next) return;
          setOpen(node.id, next);
        }}
      >
        <div
          className={cn(sidebarTreeRowShellClass({ active: false, favorited }))}
          style={rowPad(depth)}
        >
          {isRenaming && sidebarRename ? (
            <div
              className={cn(
                sidebarTreeRowMainClass({ active: false, favorited }),
                "flex min-w-0 flex-1 items-center gap-1.5 py-[5px] pl-2.5 pr-1"
              )}
            >
              <CollapsibleTrigger
                type="button"
                className="chevron-wrap flex h-7 w-4 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
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
                className="h-[15px] w-[15px] shrink-0 text-zinc-600 dark:text-zinc-300"
                aria-hidden
              />
              <div
                className="min-w-0 flex-1"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <InlineCreateField
                  key={`rename-${node.id}`}
                  value={sidebarRename.value}
                  onChange={sidebarRename.onChange}
                  onSubmit={sidebarRename.onSave}
                  onCancel={sidebarRename.onCancel}
                  placeholder="Subject name"
                  pending={sidebarRename.isPending}
                />
              </div>
            </div>
          ) : (
            <CollapsibleTrigger
              type="button"
              className={cn(
                sidebarTreeRowMainClass({ active: false, favorited }),
                "w-full min-w-0 flex-1 [&[data-state=open]>span.chevron-wrap>svg]:rotate-90"
              )}
            >
              <span className="chevron-wrap flex w-4 shrink-0 items-center justify-center">
                <ChevronRight
                  className="h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ease-out"
                  aria-hidden
                />
              </span>
              <SubjectIcon
                className="h-[15px] w-[15px] shrink-0 text-zinc-600 dark:text-zinc-300"
                aria-hidden
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-left font-medium",
                  favorited
                    ? "text-amber-950 dark:text-amber-100"
                    : "text-zinc-800 dark:text-zinc-100"
                )}
              >
                {node.name}
              </span>
            </CollapsibleTrigger>
          )}
          {!isRenaming ? (
            <SidebarItemMoreMenu
              label={node.name}
              isFavorite={onToggleFavorite ? favorited : undefined}
              onFavoriteToggle={
                onToggleFavorite && node.subjectId
                  ? () =>
                      onToggleFavorite({ kind: "subject", id: node.subjectId })
                  : undefined
              }
              onRename={
                canRename && node.subjectId
                  ? () =>
                      onRequestSidebarRename!({
                        treeNodeId: node.id,
                        kind: "subject",
                        entityId: node.subjectId,
                        currentTitle: node.name,
                      })
                  : undefined
              }
              onDelete={
                canDeleteSubject && node.subjectId
                  ? () =>
                      onRequestDelete!({
                        kind: "subject",
                        entityId: node.subjectId,
                        label: node.name,
                      })
                  : undefined
              }
            />
          ) : null}
        </div>
        <CollapsibleContent>
          {actionsBlock}
          {childList}
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

function ChapterBranchRow({
  depth,
  mustStayOpen,
  open,
  onOpenChange,
  node,
  onCreateChapterNote,
  creatingChapterId,
  children,
}: {
  depth: number;
  mustStayOpen: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: ChapterSidebarTreeNode;
  onCreateChapterNote?: TreeNodeProps["onCreateChapterNote"];
  creatingChapterId?: string | null;
  children: ReactNode;
}) {
  const [noteInlineOpen, setNoteInlineOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const Icon = KIND_ICONS.chapter;
  const canCreate =
    !!onCreateChapterNote &&
    !!node.subjectId &&
    !!node.chapterId &&
    node.kind === "chapter";
  const busy = !!node.chapterId && creatingChapterId === node.chapterId;

  const cancelNote = () => {
    setNoteInlineOpen(false);
    setNoteDraft("");
  };

  const submitNote = async () => {
    if (!onCreateChapterNote || !node.subjectId || !node.chapterId) return;
    try {
      await onCreateChapterNote({
        subjectId: node.subjectId,
        chapterId: node.chapterId,
        title: noteDraft,
      });
      cancelNote();
    } catch {
      /* react-query surfaces error */
    }
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={(next) => {
        if (mustStayOpen && !next) return;
        onOpenChange(next);
      }}
    >
        <div className="flex min-w-0 flex-col gap-0.5" style={rowPad(depth)}>
          <div className={cn(sidebarTreeRowShellClass({ active: false }))}>
            <CollapsibleTrigger
              type="button"
              className={cn(
                sidebarTreeRowMainClass({ active: false }),
                "w-full min-w-0 flex-1 [&[data-state=open]>span.chevron-wrap>svg]:rotate-90"
              )}
            >
              <span className="chevron-wrap flex w-4 shrink-0 items-center justify-center">
                <ChevronRight
                  className="h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ease-out"
                  aria-hidden
                />
              </span>
              <Icon
                className="h-[15px] w-[15px] shrink-0 text-zinc-500 dark:text-zinc-400"
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-left text-zinc-700 dark:text-zinc-200">
                {node.title}
              </span>
            </CollapsibleTrigger>
            <SidebarItemMoreMenu label={node.title} />
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
      {children}
    </Collapsible>
  );
}
