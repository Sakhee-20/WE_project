import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { createSubjectSchema } from "@/lib/validations/resources";
import {
  subjectIncludeSidebar,
  subjectWithSidebarRelations,
} from "@/lib/prisma/subject-include";

export async function GET() {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const subjects = await prisma.subject.findMany({
      where: { userId: auth.user.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: subjectIncludeSidebar,
    });

    return NextResponse.json(subjects.map(subjectWithSidebarRelations));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = createSubjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name: parsed.data.name,
        userId: auth.user.id,
        order: 0,
      },
      include: subjectIncludeSidebar,
    });

    return NextResponse.json(subjectWithSidebarRelations(subject), {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
