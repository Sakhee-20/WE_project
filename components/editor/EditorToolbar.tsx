"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  SquareCode,
  ImagePlus,
  Sparkles,
  Download,
  ChevronDown,
  FileText,
  FileDown,
} from "lucide-react";

type Props = {
  editor: Editor | null;
  onInsertImageClick?: () => void;
  imageUploadBusy?: boolean;
  onAiClick?: () => void;
  aiPanelOpen?: boolean;
  /** When set with exportEnabled, shows Export menu (Markdown / PDF). */
  noteId?: string;
  exportEnabled?: boolean;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
        active
          ? "bg-zinc-200 text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        disabled ? "pointer-events-none opacity-40" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ExportMenu({ noteId }: { noteId: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const href = (format: "markdown" | "pdf") =>
    `/api/notes/${noteId}/export?format=${format}`;

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        title="Export note"
        onClick={() => setOpen((o) => !o)}
        className={[
          "inline-flex h-8 items-center gap-0.5 rounded-md px-1.5 text-sm transition-colors",
          open
            ? "bg-zinc-200 text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        ].join(" ")}
      >
        <Download className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline text-xs font-medium pr-0.5">
          Export
        </span>
        <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[10.5rem] rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
          role="menu"
        >
          <a
            role="menuitem"
            href={href("markdown")}
            className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-800 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
            Markdown (.md)
          </a>
          <a
            role="menuitem"
            href={href("pdf")}
            className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-800 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            <FileDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
            PDF
          </a>
        </div>
      )}
    </div>
  );
}

export function EditorToolbar({
  editor,
  onInsertImageClick,
  imageUploadBusy,
  onAiClick,
  aiPanelOpen,
  noteId,
  exportEnabled = true,
}: Props) {
  if (!editor) {
    return (
      <div className="flex h-11 min-w-0 max-w-full items-center gap-0.5 overflow-x-hidden border-b border-zinc-200 bg-zinc-50 px-1.5 sm:px-2 dark:border-zinc-800 dark:bg-zinc-900/80" />
    );
  }

  return (
    <div className="flex max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto overflow-y-hidden border-b border-zinc-200 bg-zinc-50 px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
      <ToolbarButton
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
      <ToolbarButton
        title="Inline code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <SquareCode className="h-4 w-4" />
      </ToolbarButton>
      {onInsertImageClick && (
        <>
          <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
          <ToolbarButton
            title="Insert image"
            disabled={imageUploadBusy}
            onClick={onInsertImageClick}
          >
            <ImagePlus className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}
      {onAiClick && (
        <>
          <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
          <ToolbarButton
            title={aiPanelOpen ? "Hide AI panel" : "Open AI panel"}
            active={aiPanelOpen}
            onClick={onAiClick}
          >
            <Sparkles className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}
      {exportEnabled && noteId && (
        <>
          <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />
          <ExportMenu noteId={noteId} />
        </>
      )}
    </div>
  );
}
