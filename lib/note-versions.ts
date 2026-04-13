import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const NOTE_VERSION_LIMIT = 10;

/**
 * Inserts a content snapshot for a note and deletes older rows past NOTE_VERSION_LIMIT.
 */
export async function recordNoteContentVersion(
  noteId: string,
  content: Prisma.InputJsonValue
): Promise<void> {
  await prisma.version.create({
    data: {
      noteId,
      content,
    },
  });

  const excess = await prisma.version.findMany({
    where: { noteId },
    orderBy: { createdAt: "desc" },
    skip: NOTE_VERSION_LIMIT,
    select: { id: true },
  });

  if (excess.length === 0) return;

  await prisma.version.deleteMany({
    where: { id: { in: excess.map((v) => v.id) } },
  });
}
