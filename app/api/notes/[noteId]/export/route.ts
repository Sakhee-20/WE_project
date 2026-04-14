import { NextResponse } from "next/server";
import type { JSONContent } from "@tiptap/core";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { noteJsonToMarkdown } from "@/lib/export/note-to-markdown";
import { renderNotePdfBuffer } from "@/lib/export/note-pdf-document";
import { activeNoteWhere } from "@/lib/prisma/note-access";

type RouteContext = { params: { noteId: string } };

function attachmentFilename(title: string, ext: string): string {
  const base = title.trim() || "note";
  const ascii = base
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/[/\\?%*:|"<>]/g, "_")
    .slice(0, 120);
  const encoded = encodeURIComponent(`${base}.${ext}`);
  return `attachment; filename="${ascii || "note"}.${ext}"; filename*=UTF-8''${encoded}`;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { noteId } = context.params;
    const format = new URL(request.url).searchParams.get("format");

    const note = await prisma.note.findFirst({
      where: activeNoteWhere(auth.user.id, noteId),
      select: { title: true, content: true },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const title = note.title?.trim() || "Untitled";
    const content = note.content as JSONContent;

    if (format === "markdown") {
      const md = noteJsonToMarkdown(title, content);
      return new NextResponse(md, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": attachmentFilename(title, "md"),
        },
      });
    }

    if (format === "pdf") {
      const buf = await renderNotePdfBuffer(title, content);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": attachmentFilename(title, "pdf"),
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format", hint: "Use format=markdown or format=pdf" },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
