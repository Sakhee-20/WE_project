"use client";

import { useEffect, useState } from "react";
import { BubbleMenu } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Image as ImageIcon,
} from "lucide-react";
import type { NoteImageAlign } from "./note-image-extension";

const WIDTH_PRESETS = [
  { label: "S", value: 33, title: "Small (33%)" },
  { label: "M", value: 50, title: "Medium (50%)" },
  { label: "L", value: 75, title: "Large (75%)" },
  { label: "Full", value: 100, title: "Full width" },
] as const;

type Props = {
  editor: Editor | null;
  readOnly?: boolean;
};

function readImageAttrs(editor: Editor) {
  return editor.getAttributes("image") as {
    widthPercent?: number;
    align?: NoteImageAlign;
    caption?: string;
  };
}

export function EditorImageBubbleMenu({ editor, readOnly = false }: Props) {
  const [captionDraft, setCaptionDraft] = useState("");

  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      if (editor.isActive("image")) {
        setCaptionDraft(readImageAttrs(editor).caption ?? "");
      }
    };
    sync();
    editor.on("selectionUpdate", sync);
    return () => {
      editor.off("selectionUpdate", sync);
    };
  }, [editor]);

  if (!editor || readOnly) return null;

  const applyCaption = () => {
    if (!editor.isActive("image")) return;
    editor
      .chain()
      .focus()
      .updateAttributes("image", { caption: captionDraft.trim() })
      .run();
  };

  const setAlign = (align: NoteImageAlign) => {
    editor.chain().focus().updateAttributes("image", { align }).run();
  };

  const setWidth = (widthPercent: number) => {
    editor.chain().focus().updateAttributes("image", { widthPercent }).run();
  };

  const attrs = readImageAttrs(editor);
  const currentAlign = attrs.align ?? "center";
  const currentW = attrs.widthPercent ?? 100;

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="editorImageBubbleMenu"
      shouldShow={({ editor: ed }) => ed.isActive("image")}
      tippyOptions={{ duration: 120, maxWidth: "none", zIndex: 35 }}
      className="!m-0"
    >
      <div
        className="flex max-w-[min(100vw-2rem,20rem)] flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-600 dark:bg-zinc-900"
        role="toolbar"
        aria-label="Image options"
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-zinc-100 pb-2 dark:border-zinc-700">
          <span className="mr-1 flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <ImageIcon className="h-3 w-3" aria-hidden />
            Align
          </span>
          {(
            [
              { v: "left" as const, Icon: AlignLeft, t: "Align left" },
              { v: "center" as const, Icon: AlignCenter, t: "Center" },
              { v: "right" as const, Icon: AlignRight, t: "Align right" },
            ] as const
          ).map(({ v, Icon, t }) => (
            <button
              key={v}
              type="button"
              title={t}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setAlign(v)}
              className={[
                "rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                currentAlign === v
                  ? "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100"
                  : "",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Size
          </span>
          {WIDTH_PRESETS.map(({ label, value, title }) => (
            <button
              key={value}
              type="button"
              title={title}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setWidth(value)}
              className={[
                "rounded-md px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                currentW === value
                  ? "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100"
                  : "",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="note-image-caption"
            className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Caption
          </label>
          <input
            id="note-image-caption"
            type="text"
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            onBlur={() => applyCaption()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyCaption();
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Optional caption below image"
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
      </div>
    </BubbleMenu>
  );
}
