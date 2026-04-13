import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { prisma } from "@/lib/prisma";
import { EMPTY_DOC } from "@/lib/tiptap/empty-doc";
import { ShareNoteLive } from "@/components/share/ShareNoteLive";
import { ShareNoteStatic } from "@/components/share/ShareNoteStatic";

function toEditorContent(raw: unknown): JSONContent {
  if (
    typeof raw === "object" &&
    raw !== null &&
    (raw as { type?: string }).type === "doc"
  ) {
    return raw as JSONContent;
  }
  return EMPTY_DOC;
}

export default async function SharedNotePage({
  params,
}: {
  params: { token: string };
}) {
  const token = params.token?.trim();
  if (!token) notFound();

  const share = await prisma.noteShare.findUnique({
    where: { token },
    include: {
      note: { select: { id: true, title: true, content: true } },
    },
  });

  if (!share) notFound();

  const content = toEditorContent(share.note.content);
  const liveblocksOn =
    process.env.NEXT_PUBLIC_LIVEBLOCKS_ENABLED === "true";

  return (
    <div className="min-h-screen bg-zinc-50/80">
      <header className="border-b border-zinc-200 bg-white px-4 py-3">
        <p className="text-center text-xs text-zinc-500">Shared note</p>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-7xl px-2 py-5 sm:px-3 sm:py-7 md:px-4">
        {liveblocksOn ? (
          <ShareNoteLive
            token={share.token}
            noteId={share.noteId}
            initialTitle={share.note.title}
            initialContent={content}
            canEdit={share.canEdit}
          />
        ) : (
          <ShareNoteStatic
            title={share.note.title}
            initialContent={content}
            canEdit={share.canEdit}
          />
        )}
      </main>
    </div>
  );
}
