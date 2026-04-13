export type CommandPaletteItemKind = "note" | "subject" | "chapter";

/** Row for command palette / search index (Fuse targets title, meta, snippet). */
export type CommandPaletteItem = {
  key: string;
  kind: CommandPaletteItemKind;
  title: string;
  meta: string;
  snippet: string;
  href: string | null;
  /** Present for notes; used for default ordering when the query is empty. */
  updatedAt?: string;
};
