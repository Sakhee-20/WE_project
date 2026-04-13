import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import {
  subjectIncludeSidebar,
  subjectWithSidebarRelations,
} from "@/lib/prisma/subject-include";

type RouteContext = { params: { id: string } };

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { id } = context.params;

    const existing = await prisma.subject.findFirst({
      where: { id, userId: auth.user.id },
      select: { id: true, isFavorite: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: { isFavorite: !existing.isFavorite },
      include: subjectIncludeSidebar,
    });

    return NextResponse.json(subjectWithSidebarRelations(subject));
  } catch (error) {
    return handleApiError(error);
  }
}
