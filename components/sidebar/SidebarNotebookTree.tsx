"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Folder } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SubjectSidebarTreeNode } from "./types";
import { NotebookDndTree } from "./NotebookDndTree";
import { TreeNode } from "./TreeNode";
import {
  getAncestorBranchIdsForNoteId,
  getAncestorBranchIdsForPathname,
  parseNoteCuidFromPathname,
} from "./tree-utils";

type TreeProps = {
  nodes: SubjectSidebarTreeNode[];
  collapsed: boolean;
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

export function SidebarNotebookTree({
  nodes,
  collapsed,
  onCreateChapterNote,
  onCreateSubjectNote,
  onCreateChapter,
  creatingChapterId,
  creatingChapterSubjectId,
  creatingSubjectId,
  workspaceDnd = false,
}: TreeProps) {
  const pathname = usePathname();
  const [openOverrides, setOpenOverrides] = useState<Record<string, boolean>>(
    {}
  );

  const rawNoteCuid = useMemo(
    () => parseNoteCuidFromPathname(pathname),
    [pathname]
  );
  const activeNoteNodeId = rawNoteCuid ? `note:${rawNoteCuid}` : null;

  const ancestorOpenIds = useMemo(() => {
    if (rawNoteCuid) {
      return getAncestorBranchIdsForNoteId(rawNoteCuid, nodes);
    }
    return getAncestorBranchIdsForPathname(pathname, nodes);
  }, [rawNoteCuid, pathname, nodes]);

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

  const onLeafClick = useCallback(() => {
    /* pathname drives active state */
  }, []);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-2" aria-hidden>
        <Folder className="h-[18px] w-[18px] text-amber-600/80 dark:text-amber-500/80" />
      </div>
    );
  }

  const treeProps = {
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
  };

  return (
    <ScrollArea className="h-full min-h-[140px] max-h-[min(320px,calc(100vh-14rem))]">
      {workspaceDnd ? (
        <NotebookDndTree nodes={nodes} {...treeProps} />
      ) : (
        <ul className="space-y-0.5 pb-2 pr-3" role="tree">
          {nodes.map((node) => (
            <TreeNode key={node.id} node={node} depth={0} {...treeProps} />
          ))}
        </ul>
      )}
    </ScrollArea>
  );
}
