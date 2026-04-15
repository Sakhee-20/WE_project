import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/prisma/active-filters";
import { extractNoteLinkIdsFromContent } from "@/lib/tiptap/extract-note-link-ids";

/**
 * Rebuild outgoing references for a note from TipTap JSON content.
 * Invalid or self-targeting links are dropped.
 */
export async function syncNoteOutgoingReferences(
  fromNoteId: string,
  userId: string,
  content: unknown
): Promise<void> {
  const rawIds = extractNoteLinkIdsFromContent(content);
  const unique = [...new Set(rawIds)].filter((id) => id !== fromNoteId);
  if (unique.length === 0) {
    await prisma.noteReference.deleteMany({ where: { fromNoteId } });
    return;
  }

  const allowed = await prisma.note.findMany({
    where: {
      id: { in: unique },
      ...notDeleted,
      chapter: {
        ...notDeleted,
        subject: { userId, ...notDeleted },
      },
    },
    select: { id: true },
  });
  const targets = allowed.map((n) => n.id);

  await prisma.$transaction(async (tx) => {
    await tx.noteReference.deleteMany({ where: { fromNoteId } });
    if (targets.length > 0) {
      await tx.noteReference.createMany({
        data: targets.map((toNoteId) => ({ fromNoteId, toNoteId })),
        skipDuplicates: true,
      });
    }
  });
}
