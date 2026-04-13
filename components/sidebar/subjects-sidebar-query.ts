"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SubjectWithChaptersAndNotes } from "@/lib/subjects-tree";

export const SUBJECTS_SIDEBAR_QUERY_KEY = ["subjects", "sidebar-tree"] as const;

export async function fetchSubjectsForSidebar(): Promise<
  SubjectWithChaptersAndNotes[]
> {
  const res = await fetch("/api/subjects");
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Unauthorized" : "Failed to load subjects");
  }
  return res.json();
}

export function useSubjectsSidebarTree(enabled: boolean) {
  return useQuery({
    queryKey: SUBJECTS_SIDEBAR_QUERY_KEY,
    queryFn: fetchSubjectsForSidebar,
    enabled,
  });
}

export function useInvalidateSubjectsSidebar() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: SUBJECTS_SIDEBAR_QUERY_KEY });
}
