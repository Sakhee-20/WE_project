import { NextResponse } from "next/server";
import type { JSONContent } from "@tiptap/core";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import {
  subjectIncludeSidebar,
  subjectWithSidebarRelations,
} from "@/lib/prisma/subject-include";
import { tiptapJsonToPlainText } from "@/lib/tiptap/json-to-plain-text";
import { buildNotebookNoteHref } from "@/lib/notebook-paths";
import type { CommandPaletteItem } from "@/lib/search/types";

export const dynamic = "force-dynamic";

const SNIPPET_LEN = 280;

type SearchIndexNoteRow = {
  id: string;
  title: string;
  content: unknown;
  updatedAt: Date;
};

type SearchIndexChapterRow = {
  id: string;
  title: string;
  notes: SearchIndexNoteRow[];
};

type SearchIndexSubjectRow = {
  id: string;
  name: string;
  chapters: SearchIndexChapterRow[];
};

function firstRealNoteInSubject(subject: {
  chapters: { id: string; notes: { id: string }[] }[];
}): { chapterId: string; noteId: string } | null {
  for (const ch of subject.chapters) {
    const n = ch.notes.find((x) => !x.id.startsWith("optimistic:"));
    if (n) return { chapterId: ch.id, noteId: n.id };
  }
  return null;
}

function firstRealNoteIdInChapter(chapter: { notes: { id: string }[] }): string | null {
  const n = chapter.notes.find((x) => !x.id.startsWith("optimistic:"));
  return n?.id ?? null;
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const raw = await prisma.subject.findMany({
      where: { userId: auth.user.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: subjectIncludeSidebar,
    });

    const subjects = raw.map(subjectWithSidebarRelations) as unknown as SearchIndexSubjectRow[];

    const items: CommandPaletteItem[] = [];

    for (const subject of subjects) {
      const jump = firstRealNoteInSubject(subject);
      const subHref = jump
        ? buildNotebookNoteHref(subject.id, jump.chapterId, jump.noteId)
        : null;

      items.push({
        key: `subject:${subject.id}`,
        kind: "subject",
        title: subject.name,
        meta: "Subject",
        snippet: subHref
          ? "Open the first note in this subject"
          : "No notes in this subject yet",
        href: subHref,
      });

      for (const chapter of subject.chapters) {
        const noteId = firstRealNoteIdInChapter(chapter);
        const chHref = noteId
          ? buildNotebookNoteHref(subject.id, chapter.id, noteId)
          : null;

        items.push({
          key: `chapter:${chapter.id}`,
          kind: "chapter",
          title: chapter.title,
          meta: `${subject.name} · Chapter`,
          snippet: chHref
            ? "Open the first note in this chapter"
            : "No notes in this chapter yet",
          href: chHref,
        });

        for (const note of chapter.notes) {
          if (note.id.startsWith("optimistic:")) continue;
          const plain = tiptapJsonToPlainText(note.content as JSONContent);
          const snippet =
            plain.length <= SNIPPET_LEN
              ? plain
              : `${plain.slice(0, SNIPPET_LEN).trim()}…`;

          items.push({
            key: `note:${note.id}`,
            kind: "note",
            title: note.title?.trim() || "Untitled",
            meta: `${subject.name} · ${chapter.title}`,
            snippet,
            href: buildNotebookNoteHref(subject.id, chapter.id, note.id),
            updatedAt: note.updatedAt.toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ items });
  } catch (error) {
    return handleApiError(error);
  }
}
