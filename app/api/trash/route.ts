import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { notDeleted } from "@/lib/prisma/active-filters";
import type { TrashItemDto } from "@/lib/trash-types";

function mergeByDeletedAt(items: TrashItemDto[]): TrashItemDto[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
  );
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const userId = auth.user.id;

    const [trashedSubjects, trashedChapters, trashedNotes] =
      await Promise.all([
        prisma.subject.findMany({
          where: { userId, deletedAt: { not: null } },
          orderBy: { deletedAt: "desc" },
          select: { id: true, name: true, deletedAt: true },
        }),
        prisma.chapter.findMany({
          where: {
            deletedAt: { not: null },
            subject: { userId, ...notDeleted },
          },
          orderBy: { deletedAt: "desc" },
          select: {
            id: true,
            title: true,
            deletedAt: true,
            subject: { select: { name: true } },
          },
        }),
        prisma.note.findMany({
          where: {
            deletedAt: { not: null },
            chapter: {
              ...notDeleted,
              subject: { userId, ...notDeleted },
            },
          },
          orderBy: { deletedAt: "desc" },
          select: {
            id: true,
            title: true,
            deletedAt: true,
            chapter: {
              select: {
                title: true,
                subject: { select: { name: true } },
              },
            },
          },
        }),
      ]);

    const subjectItems: TrashItemDto[] = trashedSubjects.map((s) => ({
      kind: "subject",
      id: s.id,
      title: s.name,
      deletedAt: s.deletedAt!.toISOString(),
    }));

    const chapterItems: TrashItemDto[] = trashedChapters.map((c) => ({
      kind: "chapter",
      id: c.id,
      title: c.title,
      deletedAt: c.deletedAt!.toISOString(),
      context: c.subject.name,
    }));

    const noteItems: TrashItemDto[] = trashedNotes.map((n) => ({
      kind: "note",
      id: n.id,
      title: n.title,
      deletedAt: n.deletedAt!.toISOString(),
      context: `${n.chapter.subject.name} · ${n.chapter.title}`,
    }));

    const items = mergeByDeletedAt([
      ...subjectItems,
      ...chapterItems,
      ...noteItems,
    ]);

    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error);
  }
}
