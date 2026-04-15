import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ApiSessionUser = { id: string; email?: string | null; name?: string | null };

/**
 * Returns the current session user for API routes, or a 401 JSON response.
 */
export async function requireSession(): Promise<
  { user: ApiSessionUser; error: null } | { user: null; error: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true },
  });

  if (!dbUser) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "SessionStale", message: "Sign in again." },
        { status: 401 }
      ),
    };
  }

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
    },
    error: null,
  };
}
