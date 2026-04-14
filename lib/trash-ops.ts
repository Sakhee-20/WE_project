import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/prisma/active-filters";

export async function softDeleteSubject(
  subjectId: string,
  userId: string
): Promise<boolean> {
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId, ...notDeleted },
  });
  if (!subject) return false;

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const chapters = await tx.chapter.findMany({
      where: { subjectId, ...notDeleted },
      select: { id: true },
    });
    const chIds = chapters.map((c) => c.id);
    if (chIds.length) {
      await tx.note.updateMany({
        where: { chapterId: { in: chIds }, ...notDeleted },
        data: { deletedAt: now },
      });
    }
    await tx.chapter.updateMany({
      where: { subjectId, ...notDeleted },
      data: { deletedAt: now },
    });
    await tx.subject.update({
      where: { id: subjectId },
      data: { deletedAt: now },
    });
  });
  return true;
}

export async function softDeleteChapter(
  chapterId: string,
  userId: string
): Promise<boolean> {
  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      ...notDeleted,
      subject: { userId, ...notDeleted },
    },
  });
  if (!chapter) return false;

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.note.updateMany({
      where: { chapterId, ...notDeleted },
      data: { deletedAt: now },
    });
    await tx.chapter.update({
      where: { id: chapterId },
      data: { deletedAt: now },
    });
  });
  return true;
}

export async function softDeleteNote(
  noteId: string,
  userId: string
): Promise<boolean> {
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      ...notDeleted,
      chapter: {
        ...notDeleted,
        subject: { userId, ...notDeleted },
      },
    },
  });
  if (!note) return false;
  await prisma.note.update({
    where: { id: noteId },
    data: { deletedAt: new Date() },
  });
  return true;
}

export async function restoreSubject(
  subjectId: string,
  userId: string
): Promise<boolean> {
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId, deletedAt: { not: null } },
  });
  if (!subject) return false;

  await prisma.$transaction(async (tx) => {
    await tx.note.updateMany({
      where: {
        deletedAt: { not: null },
        chapter: { subjectId },
      },
      data: { deletedAt: null },
    });
    await tx.chapter.updateMany({
      where: { subjectId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    await tx.subject.update({
      where: { id: subjectId },
      data: { deletedAt: null },
    });
  });
  return true;
}

export async function restoreChapter(
  chapterId: string,
  userId: string
): Promise<boolean> {
  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      deletedAt: { not: null },
      subject: { userId, ...notDeleted },
    },
  });
  if (!chapter) return false;

  await prisma.$transaction(async (tx) => {
    await tx.note.updateMany({
      where: { chapterId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    await tx.chapter.update({
      where: { id: chapterId },
      data: { deletedAt: null },
    });
  });
  return true;
}

export async function restoreNote(
  noteId: string,
  userId: string
): Promise<boolean> {
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      deletedAt: { not: null },
      chapter: {
        ...notDeleted,
        subject: { userId, ...notDeleted },
      },
    },
  });
  if (!note) return false;
  await prisma.note.update({
    where: { id: noteId },
    data: { deletedAt: null },
  });
  return true;
}

export async function permanentDeleteSubject(
  subjectId: string,
  userId: string
): Promise<boolean> {
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId, deletedAt: { not: null } },
  });
  if (!subject) return false;
  await prisma.subject.delete({ where: { id: subjectId } });
  return true;
}

export async function permanentDeleteChapter(
  chapterId: string,
  userId: string
): Promise<boolean> {
  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      deletedAt: { not: null },
      subject: { userId },
    },
  });
  if (!chapter) return false;
  await prisma.chapter.delete({ where: { id: chapterId } });
  return true;
}

export async function permanentDeleteNote(
  noteId: string,
  userId: string
): Promise<boolean> {
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      deletedAt: { not: null },
      chapter: { subject: { userId } },
    },
  });
  if (!note) return false;
  await prisma.note.delete({ where: { id: noteId } });
  return true;
}
