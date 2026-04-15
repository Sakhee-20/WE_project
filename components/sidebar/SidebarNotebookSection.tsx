"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SubjectWithChaptersAndNotes } from "@/lib/subjects-tree";
import {
  buildSidebarSearchIndex,
  createSidebarNotesFuse,
} from "@/lib/sidebar-note-search";
import type { SubjectSidebarTreeNode } from "./types";
import { SidebarNotebookTree } from "./SidebarNotebookTree";
import { SidebarSearchResults } from "./SidebarSearchResults";

export type SidebarNotebookSectionProps = {
  collapsed: boolean;
  /** Notebook hierarchy from API or overrides */
  tree: SubjectSidebarTreeNode[];
  /** Raw subjects from API when search should run (omit when using `notebookTree` only). */
  subjectsForSearch?: SubjectWithChaptersAndNotes[];
  /** Search query from parent (note titles and bodies). */
  searchQuery?: string;
  /** Fired when "+ New Subject" is clicked */
  onNewSubject?: () => void;
  className?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
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
  workspaceDnd?: boolean;
};

function NotebookTreeSkeleton() {
  return (
    <div className="space-y-2 px-2 py-1 pr-4" aria-hidden>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-7 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800/80"
          style={{
            width: i === 1 ? "88%" : i === 2 ? "72%" : "64%",
          }}
        />
      ))}
    </div>
  );
}

/**
 * "My Notebook" block: section label, new-subject control, scrollable tree.
 */
export function SidebarNotebookSection({
  collapsed,
  tree,
  subjectsForSearch,
  searchQuery = "",
  onNewSubject,
  className,
  isLoading = false,
  isError = false,
  onRetry,
  onCreateChapterNote,
  onCreateSubjectNote,
  onCreateChapter,
  creatingChapterId,
  creatingChapterSubjectId,
  creatingSubjectId,
  workspaceDnd = false,
}: SidebarNotebookSectionProps) {
  const searchActive = Boolean(subjectsForSearch && searchQuery.trim());

  const notesFuse = useMemo(() => {
    if (!subjectsForSearch?.length) return null;
    return createSidebarNotesFuse(buildSidebarSearchIndex(subjectsForSearch));
  }, [subjectsForSearch]);

  const searchResults = useMemo(() => {
    if (!notesFuse || !searchQuery.trim()) return null;
    return notesFuse.search(searchQuery.trim());
  }, [notesFuse, searchQuery]);

  return (
    <section
      className={cn("mt-1 flex min-h-0 flex-col gap-1", className)}
      aria-labelledby="sidebar-notebook-heading"
    >
      {!collapsed && (
        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <h2
            id="sidebar-notebook-heading"
            className="truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-400"
          >
            My Notebook
          </h2>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-full justify-start gap-2 px-2 text-[13px] font-normal text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          collapsed && "h-9 justify-center px-0"
        )}
        onClick={onNewSubject}
        title="New subject"
        aria-label="New subject"
      >
        <Plus className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
        {!collapsed && <span>+ New Subject</span>}
      </Button>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading ? (
          collapsed ? (
            <div className="flex justify-center py-2" aria-hidden>
              <span className="h-4 w-4 animate-pulse rounded-sm bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ) : (
            <NotebookTreeSkeleton />
          )
        ) : isError ? (
          <div className="px-2 py-2 text-[13px] text-red-600 dark:text-red-400">
            <p>Could not load notebook.</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : tree.length === 0 ? (
          <p className="px-2 py-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            No subjects yet
          </p>
        ) : searchActive && searchResults ? (
          searchResults.length === 0 ? (
            <p className="px-2 py-2 text-[13px] text-zinc-500 dark:text-zinc-400">
              No notes match your search.
            </p>
          ) : (
            <SidebarSearchResults results={searchResults} />
          )
        ) : (
          <SidebarNotebookTree
            nodes={tree}
            collapsed={collapsed}
            onCreateChapterNote={onCreateChapterNote}
            onCreateSubjectNote={onCreateSubjectNote}
            onCreateChapter={onCreateChapter}
            creatingChapterId={creatingChapterId}
            creatingChapterSubjectId={creatingChapterSubjectId}
            creatingSubjectId={creatingSubjectId}
            workspaceDnd={searchActive ? false : workspaceDnd}
          />
        )}
      </div>
    </section>
  );
}
