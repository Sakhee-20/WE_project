import { z } from "zod";

const noteLayoutSchema = z.object({
  id: z.string().cuid("Invalid note id"),
  order: z.number().int().min(0),
});

const chapterLayoutSchema = z.object({
  id: z.string().cuid("Invalid chapter id"),
  order: z.number().int().min(0),
  notes: z.array(noteLayoutSchema),
});

export const workspaceLayoutSchema = z.object({
  subjects: z
    .array(
      z.object({
        id: z.string().cuid("Invalid subject id"),
        order: z.number().int().min(0),
        chapters: z.array(chapterLayoutSchema),
      })
    )
    .min(0),
});

export type WorkspaceLayoutInput = z.infer<typeof workspaceLayoutSchema>;
