import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import {
  createNoteSchema,
  notesQuerySchema,
} from "@/lib/validations/resources";
import { EMPTY_DOC } from "@/lib/tiptap/empty-doc";
import { notDeleted } from "@/lib/prisma/active-filters";

export async function GET(request: Request) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const raw = {
      chapterId: searchParams.get("chapterId") ?? undefined,
    };
    const query = notesQuerySchema.parse(raw);

    const notes = await prisma.note.findMany({
      where: {
        ...notDeleted,
        chapter: {
          ...notDeleted,
          subject: { userId: auth.user.id, ...notDeleted },
        },
        ...(query.chapterId ? { chapterId: query.chapterId } : {}),
      },
      orderBy: [{ chapterId: "asc" }, { createdAt: "asc" }],
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            subject: { select: { id: true, name: true } },
          },
        },
        _count: { select: { versions: true } },
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const json = await request.json();
    const parsed = createNoteSchema.parse(json);

    const content: Prisma.InputJsonValue =
      (parsed.content as Prisma.InputJsonValue | undefined) ??
      (EMPTY_DOC as unknown as Prisma.InputJsonValue);

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: parsed.chapterId,
        ...notDeleted,
        subject: { userId: auth.user.id, ...notDeleted },
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found or access denied" },
        { status: 404 }
      );
    }

    const noteAgg = await prisma.note.aggregate({
      where: { chapterId: parsed.chapterId, ...notDeleted },
      _max: { order: true },
    });
    const noteOrder = (noteAgg._max.order ?? -1) + 1;

    const note = await prisma.note.create({
      data: {
        title: parsed.title,
        content,
        chapterId: parsed.chapterId,
        order: noteOrder,
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            subject: { select: { id: true, name: true } },
          },
        },
        _count: { select: { versions: true } },
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
