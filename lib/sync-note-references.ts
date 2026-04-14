import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/prisma/active-filters";
import { extractLinkedNoteIdsFromTiptapJson } from "@/lib/note-content-links";

/**
 * Replace stored outgoing links for a note from parsed TipTap content.
 * Only links to active notes owned by the same user are kept.
 */
export async function syncNoteReferences(
  fromNoteId: string,
  ownerUserId: string,
  content: unknown
): Promise<void> {
  const raw = extractLinkedNoteIdsFromTiptapJson(content);
  const unique = [...new Set(raw)].filter((id) => id !== fromNoteId);

  const allowedRows =
    unique.length === 0
      ? []
      : await prisma.note.findMany({
          where: {
            id: { in: unique },
            ...notDeleted,
            chapter: {
              ...notDeleted,
              subject: { userId: ownerUserId, ...notDeleted },
            },
          },
          select: { id: true },
        });
  const allowed = new Set(allowedRows.map((r) => r.id));

  await prisma.$transaction(async (tx) => {
    await tx.noteReference.deleteMany({ where: { fromNoteId } });
    if (allowed.size === 0) return;
    await tx.noteReference.createMany({
      data: [...allowed].map((toNoteId) => ({ fromNoteId, toNoteId })),
    });
  });
}
