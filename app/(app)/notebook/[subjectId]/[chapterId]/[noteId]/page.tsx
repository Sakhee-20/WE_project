import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import type { JSONContent } from "@tiptap/core";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NoteEditor } from "@/components/editor/NoteEditor";
import { NoteOpenTracker } from "@/components/note/NoteOpenTracker";
import { EMPTY_DOC } from "@/lib/tiptap/empty-doc";

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

export default async function NotebookNotePage({
  params,
  searchParams,
}: {
  params: { subjectId: string; chapterId: string; noteId: string };
  searchParams?: { focusTitle?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();

  const note = await prisma.note.findFirst({
    where: {
      id: params.noteId,
      chapterId: params.chapterId,
      chapter: {
        subjectId: params.subjectId,
        subject: { userId: session.user.id },
      },
    },
  });

  if (!note) notFound();

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-0 pb-8 sm:px-2 sm:pb-10 md:px-4 lg:px-6">
      <NoteOpenTracker noteId={note.id} />
      <NoteEditor
        key={note.id}
        noteId={note.id}
        initialTitle={note.title}
        initialContent={toEditorContent(note.content)}
        autoFocusTitle={searchParams?.focusTitle === "1"}
      />
    </div>
  );
}
