import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { updateNoteSchema } from "@/lib/validations/resources";
import { recordNoteContentVersion } from "@/lib/note-versions";
import { activeNoteWhere } from "@/lib/prisma/note-access";
import { softDeleteNote } from "@/lib/trash-ops";
import { syncNoteOutgoingReferences } from "@/lib/note-references";

type RouteContext = { params: { noteId: string } };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId } = context.params;

    const note = await prisma.note.findFirst({
      where: activeNoteWhere(auth.user.id, noteId),
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

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId } = context.params;
    const json = await request.json();
    const parsed = updateNoteSchema.parse(json);

    const existing = await prisma.note.findFirst({
      where: activeNoteWhere(auth.user.id, noteId),
    });

    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const data: Prisma.NoteUpdateInput = {};
    if (parsed.title !== undefined) data.title = parsed.title;
    if (parsed.content !== undefined) {
      data.content = parsed.content as Prisma.InputJsonValue;
    }

    await prisma.note.update({
      where: { id: noteId },
      data,
    });

    if (parsed.content !== undefined) {
      await recordNoteContentVersion(
        noteId,
        parsed.content as Prisma.InputJsonValue
      );
      await syncNoteOutgoingReferences(
        noteId,
        auth.user.id,
        parsed.content
      );
    }

    const note = await prisma.note.findFirst({
      where: activeNoteWhere(auth.user.id, noteId),
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

    return NextResponse.json(note);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId } = context.params;

    const ok = await softDeleteNote(noteId, auth.user.id);
    if (!ok) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
