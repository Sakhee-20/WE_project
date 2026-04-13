import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import {
  emptyFabricCanvas,
  updateWhiteboardSchema,
} from "@/lib/validations/whiteboard";

const defaultCanvas = (): Prisma.InputJsonValue =>
  emptyFabricCanvas() as unknown as Prisma.InputJsonValue;

export async function GET() {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    let board = await prisma.whiteboard.findUnique({
      where: { userId: auth.user.id },
    });

    if (!board) {
      board = await prisma.whiteboard.create({
        data: {
          userId: auth.user.id,
          canvasJson: defaultCanvas(),
          textContent: null,
        },
      });
    }

    return NextResponse.json(board);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const json = await request.json();
    const parsed = updateWhiteboardSchema.parse(json);

    const data: Prisma.WhiteboardUpdateInput = {};
    if (parsed.canvasJson !== undefined) {
      data.canvasJson = parsed.canvasJson as Prisma.InputJsonValue;
    }
    if (parsed.textContent !== undefined) {
      data.textContent = parsed.textContent;
    }

    const board = await prisma.whiteboard.upsert({
      where: { userId: auth.user.id },
      create: {
        userId: auth.user.id,
        canvasJson:
          (parsed.canvasJson as Prisma.InputJsonValue | undefined) ??
          defaultCanvas(),
        textContent: parsed.textContent ?? null,
      },
      update: data,
    });

    return NextResponse.json(board);
  } catch (error) {
    return handleApiError(error);
  }
}
