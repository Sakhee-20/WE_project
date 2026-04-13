import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-errors";
import { updateNoteSchema } from "@/lib/validations/resources";
import { recordNoteContentVersion } from "@/lib/note-versions";

export const dynamic = "force-dynamic";

type RouteContext = { params: { token: string } };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const token = context.params.token?.trim();
    if (!token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const share = await prisma.noteShare.findUnique({
      where: { token },
      select: { id: true, noteId: true, canEdit: true },
    });

    if (!share) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!share.canEdit) {
      return NextResponse.json(
        { error: "This link is view only" },
        { status: 403 }
      );
    }

    const json = await request.json();
    const parsed = updateNoteSchema.parse(json);

    const data: Prisma.NoteUpdateInput = {};
    if (parsed.title !== undefined) data.title = parsed.title;
    if (parsed.content !== undefined) {
      data.content = parsed.content as Prisma.InputJsonValue;
    }

    await prisma.note.update({
      where: { id: share.noteId },
      data,
    });

    if (parsed.content !== undefined) {
      await recordNoteContentVersion(
        share.noteId,
        parsed.content as Prisma.InputJsonValue
      );
    }

    const note = await prisma.note.findUnique({
      where: { id: share.noteId },
      select: { id: true, title: true, content: true, updatedAt: true },
    });

    return NextResponse.json({ note });
  } catch (error) {
    return handleApiError(error);
  }
}
