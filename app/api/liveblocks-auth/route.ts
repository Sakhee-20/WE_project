import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Liveblocks } from "@liveblocks/node";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseNoteRoomId } from "@/lib/liveblocks/note-room";
import { activeNoteWhere } from "@/lib/prisma/note-access";

export const dynamic = "force-dynamic";

const liveblocksSecret = process.env.LIVEBLOCKS_SECRET_KEY;

type Body = {
  room?: string;
  shareToken?: string;
};

export async function POST(request: Request) {
  try {
    if (!liveblocksSecret?.trim()) {
      return NextResponse.json(
        { error: "Liveblocks is not configured" },
        { status: 503 }
      );
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const room = body.room;
    if (!room || typeof room !== "string") {
      return NextResponse.json({ error: "Invalid room" }, { status: 400 });
    }
    const noteId = parseNoteRoomId(room);
    if (!noteId) {
      return NextResponse.json({ error: "Invalid room" }, { status: 400 });
    }

    const liveblocks = new Liveblocks({ secret: liveblocksSecret });

    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
      const owns = await prisma.note.findFirst({
        where: activeNoteWhere(session.user.id, noteId),
        select: { id: true },
      });
      if (owns) {
        const lbSession = liveblocks.prepareSession(session.user.id, {
          userInfo: {
            name: session.user.name ?? session.user.email ?? "You",
            picture: session.user.image ?? undefined,
          },
        });
        lbSession.allow(room, lbSession.FULL_ACCESS);
        const { status, body: responseBody } = await lbSession.authorize();
        return new NextResponse(responseBody, { status });
      }
    }

    const shareToken = body.shareToken?.trim();
    if (shareToken) {
      const share = await prisma.noteShare.findUnique({
        where: { token: shareToken },
        select: { noteId: true, canEdit: true },
      });
      if (!share || share.noteId !== noteId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const noteForShare = await prisma.note.findFirst({
        where: {
          id: noteId,
          deletedAt: null,
          chapter: { deletedAt: null, subject: { deletedAt: null } },
        },
        select: { id: true },
      });
      if (!noteForShare) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const guestId = `guest:${randomUUID()}`;
      const lbSession = liveblocks.prepareSession(guestId, {
        userInfo: {
          name: share.canEdit ? "Guest (can edit)" : "Guest (view only)",
        },
      });
      lbSession.allow(
        room,
        share.canEdit ? lbSession.FULL_ACCESS : lbSession.READ_ACCESS
      );
      const { status, body: responseBody } = await lbSession.authorize();
      return new NextResponse(responseBody, { status });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    console.error("[liveblocks-auth]", e);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
