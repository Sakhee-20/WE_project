import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    await prisma.user.update({
      where: { id: auth.user.id },
      data: { onboardingCompletedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
