import { z } from "zod";

export const trashKindSchema = z.enum(["subject", "chapter", "note"]);

export const trashItemActionSchema = z.object({
  kind: trashKindSchema,
  id: z.string().min(1),
});

export type TrashItemAction = z.infer<typeof trashItemActionSchema>;
