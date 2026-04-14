import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { notDeleted } from "@/lib/prisma/active-filters";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().optional(),
  exclude: z.string().optional(),
});

const LIMIT = 40;

export async function GET(request: Request) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      exclude: searchParams.get("exclude") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const q = parsed.data.q?.trim() ?? "";
    const excludeId = parsed.data.exclude?.trim();

    const notes = await prisma.note.findMany({
      where: {
        ...notDeleted,
        chapter: {
          ...notDeleted,
          subject: { userId: auth.user.id, ...notDeleted },
        },
        ...(excludeId ? { id: { not: excludeId } } : {}),
        ...(q.length > 0 ? { title: { contains: q } } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: LIMIT,
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
    });

    return NextResponse.json({
      notes: notes.map((n) => ({
        noteId: n.id,
        title: n.title,
        chapterId: n.chapter.id,
        subjectId: n.chapter.subject.id,
        subjectName: n.chapter.subject.name,
        chapterTitle: n.chapter.title,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
