import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";

type RouteContext = {
  params: { noteId: string; versionId: string };
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId, versionId } = context.params;

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        chapter: { subject: { userId: auth.user.id } },
      },
      select: { id: true },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const version = await prisma.version.findFirst({
      where: { id: versionId, noteId },
    });

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const content = version.content as Prisma.InputJsonValue;

    await prisma.note.update({
      where: { id: noteId },
      data: { content },
    });

    const updated = await prisma.note.findFirst({
      where: { id: noteId },
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

    return NextResponse.json({
      note: updated,
      content,
      restoredVersionId: versionId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
