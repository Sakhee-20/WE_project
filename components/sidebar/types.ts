import type { LucideIcon } from "lucide-react";

/** Drives icons and row behavior in {@link TreeNode}. */
export type SidebarTreeNodeKind = "subject" | "chapter" | "note";

export type NoteSidebarTreeNode = {
  id: string;
  kind: "note";
  type: "page";
  title: string;
  subjectId: string;
  chapterId: string;
  isFavorite?: boolean;
  href?: string | null;
};

export type ChapterSidebarTreeNode = {
  id: string;
  kind: "chapter";
  type: "folder";
  title: string;
  subjectId: string;
  chapterId: string;
  children?: NoteSidebarTreeNode[];
};

export type SubjectSidebarTreeNode = {
  id: string;
  kind: "subject";
  type: "folder";
  name: string;
  subjectId: string;
  isFavorite?: boolean;
  children?: ChapterSidebarTreeNode[];
};

/**
 * Hierarchical items for the notebook sidebar tree.
 * Subject rows use `name` (API field). Chapter and note rows use `title`.
 */
export type SidebarTreeNode =
  | SubjectSidebarTreeNode
  | ChapterSidebarTreeNode
  | NoteSidebarTreeNode;

export type SidebarQuickLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};
