import type { Prisma } from "@prisma/client";

/** Shared include tree for subject + chapters + notes (sidebar and layout APIs). */
export const subjectIncludeSidebar: Prisma.SubjectInclude = {
  chapters: {
    orderBy: { order: "asc" },
    include: {
      notes: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          isFavorite: true,
        },
      },
    },
  },
};

export type SubjectWithSidebarInclude = Prisma.SubjectGetPayload<{
  include: typeof subjectIncludeSidebar;
}>;

type ChapterWithOptionalNotes = SubjectWithSidebarInclude["chapters"] extends
  | (infer C)[]
  | undefined
  ? C & { notes?: unknown[] }
  : never;

/**
 * Guarantees `chapters` and each chapter's `notes` are arrays so clients
 * (e.g. sidebar tree mapping) never see undefined.
 */
export function subjectWithSidebarRelations(
  subject: SubjectWithSidebarInclude
): SubjectWithSidebarInclude {
  const chapters = (subject.chapters ?? []) as ChapterWithOptionalNotes[];
  return {
    ...subject,
    chapters: chapters.map((chapter) => ({
      ...chapter,
      notes: Array.isArray(chapter.notes) ? chapter.notes : [],
    })),
  } as SubjectWithSidebarInclude;
}
