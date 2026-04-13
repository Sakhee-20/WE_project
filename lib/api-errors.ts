import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.flatten(),
      },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { error: "Invalid data supplied to database" },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A record with this value already exists" },
        { status: 409 }
      );
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Related record not found or invalid reference" },
        { status: 400 }
      );
    }
  }

  console.error("[api]", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
