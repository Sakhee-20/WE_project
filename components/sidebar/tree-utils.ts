import type { SidebarTreeNode, SubjectSidebarTreeNode } from "./types";

/** Cuid segment from `/notebook/.../[noteId]` or `/notes/[noteId]`. */
export function parseNoteCuidFromPathname(pathname: string): string | null {
  const nb = pathname.match(/^\/notebook\/[^/]+\/[^/]+\/([^/?#]+)/);
  if (nb) return nb[1] ?? null;
  const ns = pathname.match(/^\/notes\/([^/?#]+)/);
  return ns?.[1] ?? null;
}

export function findTreeNodeIdByPathname(
  nodes: SidebarTreeNode[],
  pathname: string
): string | null {
  for (const n of nodes) {
    if (n.kind === "note") {
      if (n.href && n.href === pathname) return n.id;
      continue;
    }
    if (n.children?.length) {
      const inner = findTreeNodeIdByPathname(n.children, pathname);
      if (inner) return inner;
    }
  }
  return null;
}

/** Branch folder ids that must stay expanded so the active note (by pathname) stays visible. */
export function getAncestorBranchIdsForPathname(
  pathname: string,
  nodes: SidebarTreeNode[]
): Set<string> {
  const open = new Set<string>();

  function walk(list: SidebarTreeNode[], folderChain: string[]): boolean {
    for (const n of list) {
      if (n.kind === "note") {
        if (n.href && n.href === pathname) {
          folderChain.forEach((id) => open.add(id));
          return true;
        }
        continue;
      }
      if (n.children?.length) {
        if (walk(n.children, [...folderChain, n.id])) return true;
      }
    }
    return false;
  }

  walk(nodes, []);
  return open;
}

/**
 * Expand folders that contain the note with this Prisma note id (cuid).
 * Supports routes `/notebook/.../[noteId]` and `/notes/[noteId]`.
 */
export function getAncestorBranchIdsForNoteId(
  noteCuid: string,
  nodes: SidebarTreeNode[]
): Set<string> {
  const targetId = `note:${noteCuid}`;
  const open = new Set<string>();

  function walk(list: SidebarTreeNode[], folderChain: string[]): boolean {
    for (const n of list) {
      if (n.kind === "note") {
        if (n.id === targetId) {
          folderChain.forEach((id) => open.add(id));
          return true;
        }
        continue;
      }
      if (n.children?.length) {
        if (walk(n.children, [...folderChain, n.id])) return true;
      }
    }
    return false;
  }

  walk(nodes, []);
  return open;
}

/** Label for drag overlay (matches sidebar node ids like `subject:cuid`). */
export function findSidebarDragLabel(
  nodes: SubjectSidebarTreeNode[],
  id: string
): string {
  for (const s of nodes) {
    if (s.id === id) return s.name;
    for (const ch of s.children ?? []) {
      if (ch.id === id) return ch.title;
      for (const n of ch.children ?? []) {
        if (n.id === id) return n.title;
      }
    }
  }
  return "Moving…";
}
