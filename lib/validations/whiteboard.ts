import { z } from "zod";

export const emptyFabricCanvas = () =>
  ({
    version: "5.3.0",
    objects: [],
    background: "",
  }) as const;

export const updateWhiteboardSchema = z
  .object({
    canvasJson: z.any().optional(),
    textContent: z.string().max(500_000).optional().nullable(),
  })
  .refine(
    (d) => d.canvasJson !== undefined || d.textContent !== undefined,
    { message: "Provide canvasJson and/or textContent" }
  );
