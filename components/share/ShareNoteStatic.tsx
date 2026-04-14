"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import type { JSONContent } from "@tiptap/core";
import { NoteLinkMark } from "@/components/editor/note-link-mark";

type Props = {
  title: string;
  initialContent: JSONContent;
  canEdit: boolean;
};

/**
 * Fallback when NEXT_PUBLIC_LIVEBLOCKS_ENABLED is false. Read-only snapshot.
 * If the link allows edit but Liveblocks is off, editing is not available.
 */
export function ShareNoteStatic({
  title,
  initialContent,
  canEdit,
}: Props) {
  const router = useRouter();
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class:
            "max-w-full h-auto rounded-lg border border-zinc-200 my-3 shadow-sm",
        },
      }),
      NoteLinkMark,
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "note-editor-content" },
      handleClick: (_view, _pos, event) => {
        const t = event.target as HTMLElement | null;
        const a = t?.closest?.("a[data-note-id]") as HTMLAnchorElement | null;
        if (!a) return false;
        const id = a.getAttribute("data-note-id");
        if (!id) return false;
        if (
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return false;
        }
        event.preventDefault();
        router.push(`/notes/${id}`);
        return true;
      },
    },
  });

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-4 py-3">
        <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
        <p className="mt-2 text-xs text-zinc-500">
          {canEdit
            ? "Live collaboration is disabled on this server, so this page is view only."
            : "Shared view. Live collaboration is disabled on this server."}
        </p>
      </div>
      <div className="note-editor-shell overflow-hidden rounded-b-xl">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
