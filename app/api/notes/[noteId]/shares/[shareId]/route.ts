import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";

type RouteContext = { params: { noteId: string; shareId: string } };

function noteWhere(userId: string, noteId: string) {
  return {
    id: noteId,
    chapter: { subject: { userId } },
  };
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId, shareId } = context.params;

    const note = await prisma.note.findFirst({
      where: noteWhere(auth.user.id, noteId),
      select: { id: true },
    });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const existing = await prisma.noteShare.findFirst({
      where: { id: shareId, noteId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    await prisma.noteShare.delete({ where: { id: shareId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
