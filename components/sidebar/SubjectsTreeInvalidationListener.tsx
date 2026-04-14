"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SUBJECTS_TREE_CHANGED_EVENT } from "@/lib/subjects-tree-events";
import { SUBJECTS_SIDEBAR_QUERY_KEY } from "./subjects-sidebar-query";
import { TRASH_QUERY_KEY } from "./trash-sidebar-query";

/**
 * Listens for {@link SUBJECTS_TREE_CHANGED_EVENT} and invalidates the sidebar subjects query.
 * Mount once inside {@link QueryClientProvider}.
 */
export function SubjectsTreeInvalidationListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onInvalidate = () => {
      void queryClient.invalidateQueries({ queryKey: SUBJECTS_SIDEBAR_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: TRASH_QUERY_KEY });
    };
    window.addEventListener(SUBJECTS_TREE_CHANGED_EVENT, onInvalidate);
    return () => window.removeEventListener(SUBJECTS_TREE_CHANGED_EVENT, onInvalidate);
  }, [queryClient]);

  return null;
}
