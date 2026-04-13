import { z } from "zod";

/** Body for `POST /api/subjects` (subject display name only). */
export const createSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name must be at least 1 character")
    .max(200, "Name must be at most 200 characters"),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .nullable()
      .transform((v) => (v === "" ? null : v)),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one of name or description must be provided",
  });

export const chaptersQuerySchema = z.object({
  subjectId: z.string().cuid().optional(),
});

export const createChapterSchema = z.object({
  subjectId: z.string().cuid("Invalid subject id"),
  title: z.string().trim().min(1, "Title is required").max(200),
  order: z.number().int().min(0).optional(),
});

export const notesQuerySchema = z.object({
  chapterId: z.string().cuid().optional(),
});

function isTiptapDoc(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: string }).type === "doc"
  );
}

const tiptapDocSchema = z
  .any()
  .refine(isTiptapDoc, { message: "content must be a TipTap document with type 'doc'" });

export const createNoteSchema = z.object({
  chapterId: z.string().cuid("Invalid chapter id"),
  title: z.string().trim().min(1, "Title is required").max(200),
  content: tiptapDocSchema.optional(),
});

export const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: tiptapDocSchema.optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: "At least one of title or content must be provided",
  });

export const createNoteShareSchema = z.object({
  canEdit: z.boolean().optional().default(false),
});
