import type { Editor, Range } from "@tiptap/core";

export type SlashCommandItem = {
  id: string;
  title: string;
  description: string;
  /** Extra tokens matched when filtering (for example "h1", "#", "ol"). */
  keywords?: string[];
  command: (args: { editor: Editor; range: Range }) => void;
};

export function filterSlashItems(
  items: SlashCommandItem[],
  query: string
): SlashCommandItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;
  return items.filter((item) => {
    const kw = [
      item.title,
      item.description,
      item.id,
      ...(item.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return kw.includes(q);
  });
}

export function buildSlashCommandItems(options: {
  onRequestImageUpload?: () => void;
}): SlashCommandItem[] {
  const { onRequestImageUpload } = options;

  const blocks: SlashCommandItem[] = [
    {
      id: "heading-1",
      title: "Heading 1",
      description: "Big section heading",
      keywords: ["h1", "#", "title"],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleHeading({ level: 1 })
          .run();
      },
    },
    {
      id: "heading-2",
      title: "Heading 2",
      description: "Medium section heading",
      keywords: ["h2", "##", "subtitle"],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleHeading({ level: 2 })
          .run();
      },
    },
    {
      id: "heading-3",
      title: "Heading 3",
      description: "Small section heading",
      keywords: ["h3", "###"],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleHeading({ level: 3 })
          .run();
      },
    },
    {
      id: "bullet-list",
      title: "Bullet list",
      description: "Simple bullet list",
      keywords: ["ul", "unordered", "-", "•"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      id: "numbered-list",
      title: "Numbered list",
      description: "List with numbering",
      keywords: ["ordered", "ol", "number", "1"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      id: "code-block",
      title: "Code block",
      description: "Insert a code snippet",
      keywords: ["```", "pre", "snippet"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      id: "divider",
      title: "Divider",
      description: "Horizontal rule between blocks",
      keywords: ["hr", "horizontal", "line", "separator", "---"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
  ];

  if (onRequestImageUpload) {
    blocks.push({
      id: "image",
      title: "Image",
      description: "Upload an image from your device",
      keywords: ["photo", "picture", "img", "upload"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        onRequestImageUpload();
      },
    });
  }

  return blocks;
}
