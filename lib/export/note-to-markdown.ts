import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import TurndownService from "turndown";
import { noteExportExtensions } from "@/lib/tiptap/note-export-extensions";

function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    br: "  ",
  });
  td.addRule("noteFigure", {
    filter: (node) => node.nodeName === "FIGURE",
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const img = el.querySelector("img");
      const cap = el.querySelector("figcaption");
      if (!img) return "\n\n";
      const alt = img.getAttribute("alt") ?? "";
      const src = img.getAttribute("src") ?? "";
      const caption = cap?.textContent?.trim() ?? "";
      let line = `![${alt}](${src})`;
      if (caption) line += `\n*${caption}*`;
      return `\n\n${line}\n\n`;
    },
  });
  return td;
}

let turndown: TurndownService | null = null;

export function noteJsonToMarkdown(title: string, content: JSONContent): string {
  const html = generateHTML(content, noteExportExtensions);
  if (!turndown) turndown = createTurndown();
  const body = turndown.turndown(html).trim();
  return `# ${title}\n\n${body}\n`;
}
