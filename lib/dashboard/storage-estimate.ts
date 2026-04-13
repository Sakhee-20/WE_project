import { prisma } from "@/lib/prisma";

function jsonByteLength(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    return 0;
  }
}

export type UserStorageBreakdown = {
  totalBytes: number;
  noteBodiesBytes: number;
  versionsBytes: number;
  whiteboardBytes: number;
};

/**
 * Rough storage footprint for a user's notes, versions, and whiteboard (UTF-8 JSON/text).
 */
export async function estimateUserStorageBytes(
  userId: string
): Promise<UserStorageBreakdown> {
  const notes = await prisma.note.findMany({
    where: { chapter: { subject: { userId } } },
    select: {
      content: true,
      versions: { select: { content: true } },
    },
  });

  let noteBodiesBytes = 0;
  let versionsBytes = 0;

  for (const n of notes) {
    noteBodiesBytes += jsonByteLength(n.content);
    for (const v of n.versions) {
      versionsBytes += jsonByteLength(v.content);
    }
  }

  const wb = await prisma.whiteboard.findUnique({
    where: { userId },
    select: { canvasJson: true, textContent: true },
  });

  let whiteboardBytes = 0;
  if (wb) {
    whiteboardBytes += jsonByteLength(wb.canvasJson);
    if (wb.textContent) {
      whiteboardBytes += new TextEncoder().encode(wb.textContent).length;
    }
  }

  const totalBytes = noteBodiesBytes + versionsBytes + whiteboardBytes;

  return { totalBytes, noteBodiesBytes, versionsBytes, whiteboardBytes };
}
