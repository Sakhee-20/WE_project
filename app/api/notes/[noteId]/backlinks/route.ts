import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { activeNoteWhere } from "@/lib/prisma/note-access";
import { buildNotebookNoteHref } from "@/lib/notebook-paths";
import { notDeleted } from "@/lib/prisma/active-filters";

type RouteContext = { params: { noteId: string } };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId } = context.params;
    const userId = auth.user.id;

    const anchor = await prisma.note.findFirst({
      where: activeNoteWhere(userId, noteId),
      select: { id: true },
    });
    if (!anchor) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const refs = await prisma.noteReference.findMany({
      where: {
        toNoteId: noteId,
        fromNote: {
          ...notDeleted,
          chapter: {
            ...notDeleted,
            subject: { userId, ...notDeleted },
          },
        },
      },
      select: {
        fromNote: {
          select: {
            id: true,
            title: true,
            chapter: {
              select: {
                id: true,
                subjectId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const backlinks = refs.map((r) => {
      const n = r.fromNote;
      const title = n.title.trim() || "Untitled";
      return {
        id: n.id,
        title,
        href: buildNotebookNoteHref(
          n.chapter.subjectId,
          n.chapter.id,
          n.id
        ),
      };
    });

    return NextResponse.json({ backlinks });
  } catch (error) {
    return handleApiError(error);
  }
}
