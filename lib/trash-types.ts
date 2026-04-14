export type TrashItemDto = {
  kind: "subject" | "chapter" | "note";
  id: string;
  title: string;
  deletedAt: string;
  context?: string;
};
