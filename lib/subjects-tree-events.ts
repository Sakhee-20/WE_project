/** Dispatched after subjects, chapters, or notes change so the sidebar refetches. */
export const SUBJECTS_TREE_CHANGED_EVENT = "we:subjects-tree-changed" as const;

export function broadcastSubjectsTreeInvalidation() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SUBJECTS_TREE_CHANGED_EVENT));
}
