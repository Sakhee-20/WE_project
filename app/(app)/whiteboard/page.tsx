import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emptyFabricCanvas } from "@/lib/validations/whiteboard";
import { WhiteboardClient } from "@/components/whiteboard/WhiteboardClient";

export default async function WhiteboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  let board = await prisma.whiteboard.findUnique({
    where: { userId: session.user.id },
  });

  if (!board) {
    board = await prisma.whiteboard.create({
      data: {
        userId: session.user.id,
        canvasJson: emptyFabricCanvas() as unknown as Prisma.InputJsonValue,
        textContent: null,
      },
    });
  }

  return (
    <WhiteboardClient
      board={{
        id: board.id,
        canvasJson: board.canvasJson,
        textContent: board.textContent,
      }}
    />
  );
}
