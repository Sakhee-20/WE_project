import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { createNoteShareSchema } from "@/lib/validations/resources";
import { createShareToken } from "@/lib/share-token";

type RouteContext = { params: { noteId: string } };

function noteWhere(userId: string, noteId: string) {
  return {
    id: noteId,
    chapter: { subject: { userId } },
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId } = context.params;

    const note = await prisma.note.findFirst({
      where: noteWhere(auth.user.id, noteId),
      select: { id: true },
    });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const shares = await prisma.noteShare.findMany({
      where: { noteId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        canEdit: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ shares });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId } = context.params;
    const json = await request.json();
    const parsed = createNoteShareSchema.parse(json);

    const note = await prisma.note.findFirst({
      where: noteWhere(auth.user.id, noteId),
      select: { id: true },
    });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const share = await prisma.noteShare.create({
      data: {
        noteId,
        token: createShareToken(),
        canEdit: parsed.canEdit,
      },
      select: {
        id: true,
        token: true,
        canEdit: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ share }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
