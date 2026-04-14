import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { activeNoteWhere } from "@/lib/prisma/note-access";
import { notDeleted } from "@/lib/prisma/active-filters";

type RouteContext = { params: { noteId: string } };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId } = context.params;

    const target = await prisma.note.findFirst({
      where: activeNoteWhere(auth.user.id, noteId),
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const refs = await prisma.noteReference.findMany({
      where: {
        toNoteId: noteId,
        fromNote: {
          ...notDeleted,
          chapter: {
            ...notDeleted,
            subject: { userId: auth.user.id, ...notDeleted },
          },
        },
      },
      include: {
        fromNote: {
          select: {
            id: true,
            title: true,
            chapter: {
              select: {
                id: true,
                title: true,
                subject: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const backlinks = refs.map((r) => {
      const n = r.fromNote;
      return {
        noteId: n.id,
        title: n.title,
        chapterId: n.chapter.id,
        subjectId: n.chapter.subject.id,
        subjectName: n.chapter.subject.name,
        chapterTitle: n.chapter.title,
      };
    });

    return NextResponse.json({ backlinks });
  } catch (error) {
    return handleApiError(error);
  }
}
