import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { activeNoteWhere } from "@/lib/prisma/note-access";

type RouteContext = { params: { noteId: string } };

/** List version metadata (newest first). Full content is loaded only on restore. */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId } = context.params;

    const note = await prisma.note.findFirst({
      where: activeNoteWhere(auth.user.id, noteId),
      select: { id: true },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const versions = await prisma.version.findMany({
      where: { noteId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    return handleApiError(error);
  }
}
