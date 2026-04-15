import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { notDeleted } from "@/lib/prisma/active-filters";
import { buildNotebookNoteHref } from "@/lib/notebook-paths";

export const dynamic = "force-dynamic";

const LIMIT = 25;

export async function GET(request: Request) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const excludeId = searchParams.get("exclude")?.trim() ?? undefined;

    const userId = auth.user.id;

    const notes = await prisma.note.findMany({
      where: {
        ...notDeleted,
        chapter: {
          ...notDeleted,
          subject: { userId, ...notDeleted },
        },
        ...(excludeId ? { id: { not: excludeId } } : {}),
        ...(q.length > 0 ? { title: { contains: q } } : {}),
      },
      take: LIMIT,
      orderBy: [{ updatedAt: "desc" }],
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
    });

    const payload = notes.map((n) => ({
      id: n.id,
      title: n.title.trim() || "Untitled",
      href: buildNotebookNoteHref(
        n.chapter.subjectId,
        n.chapter.id,
        n.id
      ),
    }));

    return NextResponse.json({ notes: payload });
  } catch (error) {
    return handleApiError(error);
  }
}
