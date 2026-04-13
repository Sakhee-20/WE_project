import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { updateSubjectSchema } from "@/lib/validations/resources";
import {
  subjectIncludeSidebar,
  subjectWithSidebarRelations,
} from "@/lib/prisma/subject-include";

type RouteContext = { params: { id: string } };

async function updateSubjectForUser(
  id: string,
  userId: string,
  json: unknown
) {
  const parsed = updateSubjectSchema.parse(json);

  const existing = await prisma.subject.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  const subject = await prisma.subject.update({
    where: { id },
    data: {
      ...(parsed.name !== undefined && { name: parsed.name }),
      ...(parsed.description !== undefined && {
        description: parsed.description,
      }),
    },
    include: subjectIncludeSidebar,
  });

  return NextResponse.json(subjectWithSidebarRelations(subject));
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { id } = context.params;
    const json = await request.json();
    return await updateSubjectForUser(id, auth.user.id, json);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { id } = context.params;
    const json = await request.json();
    return await updateSubjectForUser(id, auth.user.id, json);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { id } = context.params;

    const deleted = await prisma.subject.deleteMany({
      where: { id, userId: auth.user.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
