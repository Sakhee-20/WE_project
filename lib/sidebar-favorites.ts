import { buildNotebookNoteHref } from "@/lib/notebook-paths";
import type { SubjectSidebarTreeNode } from "@/components/sidebar/types";
import type { SubjectWithChaptersAndNotes } from "@/lib/subjects-tree";

export type SidebarFavoriteRow =
  | { kind: "subject"; id: string; title: string; href: string | null }
  | { kind: "note"; id: string; title: string; href: string };

function sortFavoriteRows(a: SidebarFavoriteRow, b: SidebarFavoriteRow): number {
  if (a.kind !== b.kind) return a.kind === "subject" ? -1 : 1;
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
}

export function collectSidebarFavoritesFromSubjects(
  subjects: SubjectWithChaptersAndNotes[]
): SidebarFavoriteRow[] {
  const out: SidebarFavoriteRow[] = [];
  for (const s of subjects) {
    if (s.isFavorite) {
      let href: string | null = null;
      outer: for (const ch of s.chapters) {
        for (const n of ch.notes) {
          if (!n.id.startsWith("optimistic:")) {
            href = buildNotebookNoteHref(s.id, ch.id, n.id);
            break outer;
          }
        }
      }
      out.push({ kind: "subject", id: s.id, title: s.name, href });
    }
    for (const ch of s.chapters) {
      for (const n of ch.notes) {
        if (n.isFavorite && !n.id.startsWith("optimistic:")) {
          out.push({
            kind: "note",
            id: n.id,
            title: n.title,
            href: buildNotebookNoteHref(s.id, ch.id, n.id),
          });
        }
      }
    }
  }
  out.sort(sortFavoriteRows);
  return out;
}

export function collectSidebarFavoritesFromTree(
  tree: SubjectSidebarTreeNode[]
): SidebarFavoriteRow[] {
  const out: SidebarFavoriteRow[] = [];
  for (const sub of tree) {
    if (sub.isFavorite) {
      let href: string | null = null;
      outer: for (const ch of sub.children ?? []) {
        for (const n of ch.children ?? []) {
          if (n.href) {
            href = n.href;
            break outer;
          }
        }
      }
      out.push({ kind: "subject", id: sub.subjectId, title: sub.name, href });
    }
    for (const ch of sub.children ?? []) {
      for (const n of ch.children ?? []) {
        if (n.isFavorite && n.href) {
          const rawId = n.id.startsWith("note:") ? n.id.slice(5) : n.id;
          out.push({
            kind: "note",
            id: rawId,
            title: n.title,
            href: n.href,
          });
        }
      }
    }
  }
  out.sort(sortFavoriteRows);
  return out;
}
