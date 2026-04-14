import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import { trashItemActionSchema } from "@/lib/validations/trash";
import {
  permanentDeleteChapter,
  permanentDeleteNote,
  permanentDeleteSubject,
} from "@/lib/trash-ops";

export async function POST(request: Request) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const json = await request.json();
    const parsed = trashItemActionSchema.parse(json);

    let ok = false;
    switch (parsed.kind) {
      case "subject":
        ok = await permanentDeleteSubject(parsed.id, auth.user.id);
        break;
      case "chapter":
        ok = await permanentDeleteChapter(parsed.id, auth.user.id);
        break;
      case "note":
        ok = await permanentDeleteNote(parsed.id, auth.user.id);
        break;
      default:
        break;
    }

    if (!ok) {
      return NextResponse.json(
        { error: "Item not found or not in trash" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
