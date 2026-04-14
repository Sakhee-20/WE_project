import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { softDeleteChapter } from "@/lib/trash-ops";

type RouteContext = { params: { id: string } };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const { id } = context.params;

    const ok = await softDeleteChapter(id, auth.user.id);
    if (!ok) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
