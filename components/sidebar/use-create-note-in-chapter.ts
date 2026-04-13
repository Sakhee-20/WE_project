"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { buildNotebookNoteHref } from "@/lib/notebook-paths";
import {
  addChapterWithNoteToSubject,
  addNoteToChapter,
  removeChapterFromSubject,
  removeNoteFromChapter,
  replaceNoteInChapter,
  replaceOptimisticChapterWithReal,
  type SidebarNoteStub,
} from "@/lib/subjects-tree-cache";
import type { SubjectWithChaptersAndNotes } from "@/lib/subjects-tree";
import { SUBJECTS_SIDEBAR_QUERY_KEY } from "./subjects-sidebar-query";

const NEW_NOTE_TITLE = "Untitled note";
const DEFAULT_CHAPTER_TITLE = "General";

export type CreateNoteVariables =
  | { subjectId: string; chapterId: string; title?: string }
  | { subjectId: string; fromSubjectRow: true; title?: string };

function resolvedNoteTitle(vars: CreateNoteVariables): string {
  const raw =
    "title" in vars && typeof vars.title === "string" ? vars.title.trim() : "";
  return raw.length > 0 ? raw : NEW_NOTE_TITLE;
}

type CreatedNoteResponse = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  chapterId: string;
  chapter: {
    id: string;
    title: string;
    subject: { id: string; name: string };
  };
};

type CreatedChapterResponse = {
  id: string;
  title: string;
  subjectId: string;
};

type MutationResult = {
  note: CreatedNoteResponse;
  createdChapter: CreatedChapterResponse | null;
};

function toStub(n: CreatedNoteResponse): SidebarNoteStub {
  return {
    id: n.id,
    title: n.title,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    isFavorite: false,
  };
}

function realChaptersOf(
  subject: SubjectWithChaptersAndNotes | undefined
): SubjectWithChaptersAndNotes["chapters"] {
  if (!subject) return [];
  return subject.chapters.filter(
    (c) => !c.id.startsWith("optimistic-chapter:")
  );
}

export function useCreateNoteInChapter() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (vars: CreateNoteVariables): Promise<MutationResult> => {
      let chapterId: string;
      let createdChapter: CreatedChapterResponse | null = null;

      if ("chapterId" in vars && vars.chapterId) {
        chapterId = vars.chapterId;
      } else {
        const snapshot =
          queryClient.getQueryData<SubjectWithChaptersAndNotes[]>(
            SUBJECTS_SIDEBAR_QUERY_KEY
          );
        const sub = snapshot?.find((s) => s.id === vars.subjectId);
        if (!sub) throw new Error("Subject not found");
        const real = realChaptersOf(sub);
        if (real.length === 0) {
          const chRes = await fetch("/api/chapters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subjectId: vars.subjectId,
              title: DEFAULT_CHAPTER_TITLE,
            }),
          });
          if (!chRes.ok) {
            const body = (await chRes.json().catch(() => null)) as {
              error?: string;
            } | null;
            throw new Error(body?.error ?? "Failed to create chapter");
          }
          createdChapter = (await chRes.json()) as CreatedChapterResponse;
          chapterId = createdChapter.id;
        } else {
          chapterId = real[0].id;
        }
      }

      const noteTitle = resolvedNoteTitle(vars);
      const noteRes = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, title: noteTitle }),
      });
      if (!noteRes.ok) {
        const body = (await noteRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Failed to create note");
      }
      const note = (await noteRes.json()) as CreatedNoteResponse;
      return { note, createdChapter };
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: SUBJECTS_SIDEBAR_QUERY_KEY });
      const previous = queryClient.getQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY
      );
      const now = new Date().toISOString();
      const optimisticNoteId = `optimistic:${crypto.randomUUID()}`;
      const noteTitle = resolvedNoteTitle(vars);
      const stub: SidebarNoteStub = {
        id: optimisticNoteId,
        title: noteTitle,
        createdAt: now,
        updatedAt: now,
        isFavorite: false,
      };

      if ("chapterId" in vars && vars.chapterId) {
        queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
          SUBJECTS_SIDEBAR_QUERY_KEY,
          (old) => addNoteToChapter(old, vars.chapterId, stub)
        );
        return {
          previous,
          mode: "existingChapter" as const,
          optimisticNoteId,
          chapterId: vars.chapterId,
          subjectId: vars.subjectId,
        };
      }

      const sub = previous?.find((s) => s.id === vars.subjectId);
      if (!sub) {
        return { previous, mode: "noop" as const, subjectId: vars.subjectId };
      }
      const real = realChaptersOf(sub);
      if (real.length === 0) {
        const optimisticChapterId = `optimistic-chapter:${crypto.randomUUID()}`;
        queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
          SUBJECTS_SIDEBAR_QUERY_KEY,
          (old) =>
            addChapterWithNoteToSubject(old, vars.subjectId, {
              id: optimisticChapterId,
              title: DEFAULT_CHAPTER_TITLE,
              notes: [stub],
            })
        );
        return {
          previous,
          mode: "newChapter" as const,
          optimisticChapterId,
          optimisticNoteId,
          subjectId: vars.subjectId,
        };
      }

      const firstId = real[0].id;
      queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
        SUBJECTS_SIDEBAR_QUERY_KEY,
        (old) => addNoteToChapter(old, firstId, stub)
      );
      return {
        previous,
        mode: "existingChapter" as const,
        optimisticNoteId,
        chapterId: firstId,
        subjectId: vars.subjectId,
      };
    },
    onError: (_err, vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(SUBJECTS_SIDEBAR_QUERY_KEY, context.previous);
        return;
      }
      if (!context || context.mode === "noop") return;

      if (context.mode === "newChapter" && context.optimisticChapterId) {
        queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
          SUBJECTS_SIDEBAR_QUERY_KEY,
          (old) =>
            removeChapterFromSubject(
              old,
              context.subjectId,
              context.optimisticChapterId
            )
        );
        return;
      }

      if (
        context.mode === "existingChapter" &&
        context.optimisticNoteId &&
        context.chapterId
      ) {
        queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
          SUBJECTS_SIDEBAR_QUERY_KEY,
          (old) =>
            removeNoteFromChapter(
              old,
              context.chapterId,
              context.optimisticNoteId
            )
        );
      }
    },
    onSuccess: (data, vars, context) => {
      const real = toStub(data.note);
      if (!context || context.mode === "noop") return;

      const createdCh = data.createdChapter;
      if (
        context.mode === "newChapter" &&
        context.optimisticChapterId &&
        context.optimisticNoteId &&
        createdCh
      ) {
        queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
          SUBJECTS_SIDEBAR_QUERY_KEY,
          (old) =>
            replaceOptimisticChapterWithReal(
              old,
              context.subjectId,
              context.optimisticChapterId,
              createdCh.id,
              createdCh.title,
              real
            )
        );
      } else if (
        context.mode === "existingChapter" &&
        context.optimisticNoteId &&
        context.chapterId
      ) {
        queryClient.setQueryData<SubjectWithChaptersAndNotes[]>(
          SUBJECTS_SIDEBAR_QUERY_KEY,
          (old) =>
            replaceNoteInChapter(
              old,
              context.chapterId,
              context.optimisticNoteId,
              real
            )
        );
      }

      const sid = data.note.chapter?.subject?.id ?? context.subjectId;
      const cid = data.note.chapterId ?? context.chapterId;
      router.push(`${buildNotebookNoteHref(sid, cid, data.note.id)}?focusTitle=1`);
      router.refresh();
    },
  });
}
