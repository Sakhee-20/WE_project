import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

type RouteContext = { params: { noteId: string } };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId } = context.params;

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

    await prisma.noteOpen.upsert({
      where: {
        userId_noteId: {
          userId: auth.user.id,
          noteId,
        },
      },
      create: {
        userId: auth.user.id,
        noteId,
      },
      update: {
        openedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
