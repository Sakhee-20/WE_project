import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import {
  chaptersQuerySchema,
  createChapterSchema,
} from "@/lib/validations/resources";

export async function GET(request: Request) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const raw = {
      subjectId: searchParams.get("subjectId") ?? undefined,
    };
    const query = chaptersQuerySchema.parse(raw);

    const chapters = await prisma.chapter.findMany({
      where: {
        subject: { userId: auth.user.id },
        ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      },
      orderBy: [{ subjectId: "asc" }, { order: "asc" }],
      include: {
        subject: { select: { id: true, name: true } },
        _count: { select: { notes: true } },
      },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const json = await request.json();
    const parsed = createChapterSchema.parse(json);

    const subject = await prisma.subject.findFirst({
      where: { id: parsed.subjectId, userId: auth.user.id },
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found or access denied" },
        { status: 404 }
      );
    }

    let order = parsed.order;
    if (order === undefined) {
      const agg = await prisma.chapter.aggregate({
        where: { subjectId: parsed.subjectId },
        _max: { order: true },
      });
      order = (agg._max.order ?? -1) + 1;
    }

    const chapter = await prisma.chapter.create({
      data: {
        title: parsed.title,
        order,
        subjectId: parsed.subjectId,
      },
      include: {
        subject: { select: { id: true, name: true } },
        _count: { select: { notes: true } },
      },
    });

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
