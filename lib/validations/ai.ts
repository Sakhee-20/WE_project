import { z } from "zod";

export const aiActionSchema = z.enum([
  "summarize_note",
  "generate_quiz",
  "generate_flashcards",
  "explain_eli5",
  "explain_selection",
  "convert_bullets",
  "summarize_selection",
  "fix_grammar_selection",
  "generate_flashcards_selection",
]);

export type AiAction = z.infer<typeof aiActionSchema>;

export const AI_SELECTION_ACTIONS = new Set<AiAction>([
  "explain_eli5",
  "explain_selection",
  "convert_bullets",
  "summarize_selection",
  "fix_grammar_selection",
  "generate_flashcards_selection",
]);

export const aiRequestSchema = z
  .object({
    action: aiActionSchema,
    noteId: z.string().cuid(),
    selectedText: z.string().max(50_000).optional(),
  })
  .superRefine((data, ctx) => {
    if (AI_SELECTION_ACTIONS.has(data.action)) {
      const t = data.selectedText?.trim() ?? "";
      if (!t) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "selectedText is required for this action",
          path: ["selectedText"],
        });
      }
    }
  });

export type AiRequestBody = z.infer<typeof aiRequestSchema>;
