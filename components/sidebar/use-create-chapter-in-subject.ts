"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addChapterWithNoteToSubject,
  removeChapterFromSubject,
  replaceOptimisticChapterMeta,
} from "@/lib/subjects-tree-cache";
import type { SubjectWithChaptersAndNotes } from "@/lib/subjects-tree";
import { SUBJECTS_SIDEBAR_QUERY_KEY } from "./subjects-sidebar-query";

export type CreateChapterVariables = { subjectId: string; title: string };

type CreatedChapterResponse = {
  id: string;
  title: string;
  subjectId: string;
};

export function useCreateChapterInSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subjectId,
      title,
    }: CreateChapterVariables): Promise<CreatedChapterResponse> => {
      const trimmed = title.trim() || "Untitled chapter";
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, title: trimmed }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Failed to create chapter");
      }
      return res.json() as Promise<CreatedChapterResponse>;
    },
    onMutate: async ({ subjectId, title }) => {
      await queryClient.cancelQueries({ queryKey: SUBJECTS_SIDEBAR_QUERY_KEY });
      const previous = queryClient.getQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY
      );
      const optId = `optimistic-chapter:${crypto.randomUUID()}`;
      const displayTitle = title.trim() || "Untitled chapter";
      queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY,
        (old) =>
          addChapterWithNoteToSubject(old, subjectId, {
            id: optId,
            title: displayTitle,
            notes: [],
          })
      );
      return { previous, optId, subjectId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(SUBJECTS_SIDEBAR_QUERY_KEY, context.previous);
        return;
      }
      if (context?.optId) {
        queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
          SUBJECTS_SIDEBAR_QUERY_KEY,
          (old) =>
            removeChapterFromSubject(old, context.subjectId, context.optId)
        );
      }
    },
    onSuccess: (data, vars, context) => {
      if (!context?.optId) return;
      queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY,
        (old) =>
          replaceOptimisticChapterMeta(
            old,
            vars.subjectId,
            context.optId,
            data.id,
            data.title
          )
      );
    },
  });
}
