import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

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

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
    error: null,
  };
}
