import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { subjectIncludeSidebar } from "@/lib/prisma/subject-include";
import { workspaceLayoutSchema } from "@/lib/validations/workspace-layout";

export async function POST(request: Request) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const json = await request.json();
    const parsed = workspaceLayoutSchema.parse(json);

    const userSubjects = await prisma.subject.findMany({
      where: { userId: auth.user.id },
      include: {
        chapters: { include: { notes: { select: { id: true } } } },
      },
    });

    const expectedSubjectIds = new Set(userSubjects.map((s) => s.id));
    const payloadSubjectIds = new Set(parsed.subjects.map((s) => s.id));
    if (
      expectedSubjectIds.size !== payloadSubjectIds.size ||
      !Array.from(expectedSubjectIds).every((id) => payloadSubjectIds.has(id))
    ) {
      return NextResponse.json(
        { error: "Subject list must include every workspace subject exactly once" },
        { status: 400 }
      );
    }

    const expectedChapterIds = new Set<string>();
    const expectedNoteIds = new Set<string>();
    for (const s of userSubjects) {
      for (const ch of s.chapters) {
        expectedChapterIds.add(ch.id);
        for (const n of ch.notes) expectedNoteIds.add(n.id);
      }
    }

    const payloadChapterIds = new Set<string>();
    const payloadNoteIds = new Set<string>();
    for (const s of parsed.subjects) {
      for (const ch of s.chapters) {
        payloadChapterIds.add(ch.id);
        for (const n of ch.notes) payloadNoteIds.add(n.id);
      }
    }

    if (
      expectedChapterIds.size !== payloadChapterIds.size ||
      !Array.from(expectedChapterIds).every((id) => payloadChapterIds.has(id))
    ) {
      return NextResponse.json(
        { error: "Chapter list must match your workspace" },
        { status: 400 }
      );
    }

    if (
      expectedNoteIds.size !== payloadNoteIds.size ||
      !Array.from(expectedNoteIds).every((id) => payloadNoteIds.has(id))
    ) {
      return NextResponse.json(
        { error: "Note list must match your workspace" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const s of parsed.subjects) {
        await tx.subject.update({
          where: { id: s.id, userId: auth.user.id },
          data: { order: s.order },
        });
        for (const ch of s.chapters) {
          await tx.chapter.update({
            where: { id: ch.id },
            data: { subjectId: s.id, order: ch.order },
          });
          for (const n of ch.notes) {
            await tx.note.update({
              where: { id: n.id },
              data: { chapterId: ch.id, order: n.order },
            });
          }
        }
      }
    });

    const subjects = await prisma.subject.findMany({
      where: { userId: auth.user.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: subjectIncludeSidebar,
    });

    return NextResponse.json(subjects);
  } catch (error) {
    return handleApiError(error);
  }
}
