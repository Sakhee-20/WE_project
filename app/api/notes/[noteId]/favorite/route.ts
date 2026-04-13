import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";

type RouteContext = { params: { noteId: string } };

function noteWhere(userId: string, noteId: string) {
  return {
    id: noteId,
    chapter: { subject: { userId } },
  };
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId } = context.params;

    const existing = await prisma.note.findFirst({
      where: noteWhere(auth.user.id, noteId),
      select: { id: true, isFavorite: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: { isFavorite: !existing.isFavorite },
      select: { id: true, isFavorite: true },
    });

    return NextResponse.json(note);
  } catch (error) {
    return handleApiError(error);
  }
}
