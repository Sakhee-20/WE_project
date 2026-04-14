import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { activeNoteWhere } from "@/lib/prisma/note-access";
import {
  getConfiguredImageStorageProvider,
  isCloudinaryConfigured,
  isSupabaseStorageConfigured,
  storageConfigErrorMessage,
  uploadEditorImage,
} from "@/lib/storage/note-editor-image-upload";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const MAX_BYTES = 5 * 1024 * 1024;

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[mime] ?? "img";
}

export async function POST(request: Request) {
  try {
    const provider = getConfiguredImageStorageProvider();
    if (provider === "supabase" && !isSupabaseStorageConfigured()) {
      return NextResponse.json(
        { error: storageConfigErrorMessage("supabase") },
        { status: 503 }
      );
    }
    if (provider === "cloudinary" && !isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: storageConfigErrorMessage("cloudinary") },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const noteIdRaw = formData.get("noteId");
    const shareTokenRaw = formData.get("shareToken");

    if (typeof noteIdRaw !== "string" || !noteIdRaw) {
      return NextResponse.json({ error: "noteId is required" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, GIF, and WebP images are allowed." },
        { status: 415 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be 5 MB or smaller." },
        { status: 413 }
      );
    }

    const note = await prisma.note.findFirst({
      where: {
        id: noteIdRaw,
        deletedAt: null,
        chapter: { deletedAt: null, subject: { deletedAt: null } },
      },
      select: {
        id: true,
        chapter: { select: { subject: { select: { userId: true } } } },
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note not found or access denied" },
        { status: 404 }
      );
    }

    const ownerId = note.chapter.subject.userId;
    const shareToken =
      typeof shareTokenRaw === "string" ? shareTokenRaw.trim() : "";

    if (shareToken) {
      const share = await prisma.noteShare.findFirst({
        where: {
          token: shareToken,
          noteId: noteIdRaw,
          canEdit: true,
        },
      });
      if (!share) {
        return NextResponse.json(
          { error: "Note not found or access denied" },
          { status: 404 }
        );
      }
    } else {
      const auth = await requireSession();
      if (auth.error) return auth.error;

      const owns = await prisma.note.findFirst({
        where: activeNoteWhere(auth.user.id, noteIdRaw),
      });
      if (!owns) {
        return NextResponse.json(
          { error: "Note not found or access denied" },
          { status: 404 }
        );
      }
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = extFromMime(file.type);

    let publicUrl: string;
    try {
      publicUrl = await uploadEditorImage({
        ownerId,
        noteId: noteIdRaw,
        bytes,
        mime: file.type,
        ext,
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Upload to storage failed";
      console.error("[upload/image]", provider, e);
      if (msg === "CLOUDINARY_NOT_CONFIGURED") {
        return NextResponse.json(
          { error: storageConfigErrorMessage("cloudinary") },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: msg || "Upload to storage failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("[upload/image]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
