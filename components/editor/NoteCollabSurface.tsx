"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { NoteImageEditor } from "./note-image-editor";
import { EditorImageBubbleMenu } from "./EditorImageBubbleMenu";
import type { JSONContent } from "@tiptap/core";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import { EditorToolbar } from "./EditorToolbar";
import { ImageUploadExtension } from "./image-upload-extension";
import { SlashCommandExtension } from "./slash-command-extension";
import { uploadNoteImage } from "@/lib/editor/upload-image-client";
import { broadcastSubjectsTreeInvalidation } from "@/lib/subjects-tree-events";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { EditorAiSidebar } from "./EditorAiSidebar";
import { EditorSelectionToolbar } from "./EditorSelectionToolbar";
import { useAiAssistant } from "./use-ai-assistant";
import { NoteSharePanel } from "./NoteSharePanel";
import { NoteLinkMark } from "./note-link-mark";
import { WikiLinkExtension } from "./wiki-link-extension";
import { NoteBacklinks } from "@/components/note/NoteBacklinks";
import { History } from "lucide-react";

import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-tiptap/styles.css";

const AUTOSAVE_MS = 30_000;

export type NoteCollabSurfaceProps = {
  noteId: string;
  initialTitle: string;
  initialContent: JSONContent;
  variant: "owner" | "share";
  /** Required for share variant persistence and uploads */
  shareToken?: string;
  /** View-only share link */
  readOnly?: boolean;
  autoFocusTitle?: boolean;
};

export function NoteCollabSurface({
  noteId,
  initialTitle,
  initialContent,
  variant,
  shareToken,
  readOnly = false,
  autoFocusTitle = false,
}: NoteCollabSurfaceProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  const snapshot = useRef({
    title: initialTitle,
    contentJson: JSON.stringify(initialContent),
  });

  const titleRef = useRef(title);
  titleRef.current = title;

  const savedClearRef = useRef<number | null>(null);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const liveblocks = useLiveblocksExtension({
    comments: false,
    initialContent,
  });

  const extensions = useMemo(() => {
    const list = [
      liveblocks,
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        history: false,
      }),
      Placeholder.configure({
        placeholder: readOnly ? "" : "Start writing…",
      }),
      NoteImageEditor.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class:
            "max-w-full h-auto rounded-lg border border-zinc-200 my-3 shadow-sm",
        },
      }),
      NoteLinkMark,
    ];
    if (!readOnly) {
      list.push(
        ImageUploadExtension.configure({
          noteId,
          shareToken: shareToken ?? null,
          getOnProgress: () => setUploadProgress,
        })
      );
      list.push(
        SlashCommandExtension.configure({
          onRequestImageUpload: () => fileInputRef.current?.click(),
        })
      );
      list.push(WikiLinkExtension.configure({ currentNoteId: noteId }));
    }
    return list;
  }, [liveblocks, noteId, readOnly, shareToken]);

  const editorProps = useMemo(
    () => ({
      attributes: {
        class: "note-editor-content",
      },
      handleClick: (_view: unknown, _pos: number, event: MouseEvent) => {
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
    }),
    [router]
  );

  const editor = useEditor(
    {
      extensions,
      content: initialContent,
      immediatelyRender: false,
      editable: !readOnly,
      editorProps,
    },
    [extensions, readOnly, editorProps]
  );

  const ai = useAiAssistant({ noteId, editor });

  const insertImageFromFile = useCallback(
    async (file: File) => {
      if (!editor || readOnly) return;
      setUploadProgress(0);
      try {
        const { url } = await uploadNoteImage(
          file,
          noteId,
          (p) => setUploadProgress(p),
          shareToken ? { shareToken } : undefined
        );
        editor.chain().focus().setImage({ src: url }).run();
      } catch (e) {
        console.error(e);
      } finally {
        setUploadProgress(null);
      }
    },
    [editor, noteId, readOnly, shareToken]
  );

  const onImageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) void insertImageFromFile(file);
    },
    [insertImageFromFile]
  );

  const handleVersionRestored = useCallback(
    (content: JSONContent) => {
      editor?.commands.setContent(content, false);
      snapshot.current = {
        title: titleRef.current,
        contentJson: JSON.stringify(content),
      };
    },
    [editor]
  );

  const persist = useCallback(async () => {
    if (!editor || readOnly) return;
    const doc = editor.getJSON();
    const contentJson = JSON.stringify(doc);
    const currentTitle = titleRef.current;
    if (
      snapshot.current.title === currentTitle &&
      snapshot.current.contentJson === contentJson
    ) {
      return;
    }

    setSaveState("saving");
    try {
      const prevTitle = snapshot.current.title;
      let res: Response;
      if (variant === "owner") {
        res = await fetch(`/api/notes/${noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: currentTitle, content: doc }),
        });
      } else {
        if (!shareToken) {
          setSaveState("idle");
          return;
        }
        res = await fetch(`/api/share/${encodeURIComponent(shareToken)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: currentTitle, content: doc }),
        });
      }

      if (!res.ok) {
        setSaveState("idle");
        return;
      }

      snapshot.current = { title: currentTitle, contentJson };
      if (variant === "owner" && prevTitle !== currentTitle) {
        broadcastSubjectsTreeInvalidation();
      }
      setSaveState("saved");
      if (savedClearRef.current) window.clearTimeout(savedClearRef.current);
      savedClearRef.current = window.setTimeout(
        () => setSaveState("idle"),
        2500
      );
    } catch {
      setSaveState("idle");
    }
  }, [editor, noteId, readOnly, shareToken, variant]);

  useEffect(() => {
    if (!editor || readOnly) return;
    const id = window.setInterval(() => {
      void persist();
    }, AUTOSAVE_MS);
    return () => window.clearInterval(id);
  }, [editor, persist, readOnly]);

  useEffect(() => {
    return () => {
      if (savedClearRef.current) window.clearTimeout(savedClearRef.current);
    };
  }, []);

  useEffect(() => {
    if (!autoFocusTitle || readOnly) return;
    const id = window.requestAnimationFrame(() => {
      const el = titleInputRef.current;
      if (!el) return;
      el.focus();
      el.select();
      const url = new URL(window.location.href);
      if (url.searchParams.has("focusTitle")) {
        url.searchParams.delete("focusTitle");
        const next =
          url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "");
        window.history.replaceState(null, "", next);
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [autoFocusTitle, readOnly, noteId]);

  const showAi = variant === "owner" && !readOnly;
  const showHistory = variant === "owner" && !readOnly;
  const showSharePanel = variant === "owner" && !readOnly;
  const showToolbar = !readOnly;

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 rounded-none border-y border-zinc-200/90 bg-white shadow-none transition-all duration-200 ease-out sm:rounded-2xl sm:border sm:shadow-sm sm:hover:border-zinc-300/80 sm:hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:sm:hover:border-zinc-700">
        <div className="flex flex-col gap-2 border-b border-zinc-100 px-2.5 py-2.5 sm:gap-3 sm:px-4 sm:py-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={readOnly}
            className="w-full min-w-0 border-0 bg-transparent text-lg font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 disabled:text-zinc-600 sm:text-xl"
            placeholder="Untitled"
            aria-label="Note title"
          />
          <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {variant === "share" && (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                {readOnly ? "Shared view" : "Shared edit"}
              </span>
            )}
            {showSharePanel && <NoteSharePanel noteId={noteId} />}
            {showHistory && (
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                title="Version history"
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 sm:px-2.5 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <History className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Version history</span>
              </button>
            )}
            {!readOnly && (
              <div
                className="min-w-[5rem] text-right text-sm tabular-nums text-zinc-500"
                aria-live="polite"
              >
                {saveState === "saving" && (
                  <span className="animate-pulse">Saving…</span>
                )}
                {saveState === "saved" && (
                  <span className="text-emerald-600 transition-opacity duration-300">
                    Saved ✓
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {showToolbar && (
          <EditorToolbar
            editor={editor}
            noteId={noteId}
            exportEnabled={variant === "owner"}
            onInsertImageClick={() => fileInputRef.current?.click()}
            imageUploadBusy={uploadProgress !== null}
            onAiClick={showAi ? () => setAiOpen((o) => !o) : undefined}
            aiPanelOpen={showAi ? aiOpen : false}
          />
        )}

        {!readOnly && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={onImageInputChange}
          />
        )}

        {uploadProgress !== null && (
          <div className="border-t border-zinc-100 bg-zinc-50/80 px-2.5 py-2 sm:px-4">
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-600">
              <span>Uploading image</span>
              <span className="tabular-nums font-medium">
                {uploadProgress}%
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-zinc-200"
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-blue-600 transition-[width] duration-150 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="note-editor-shell relative overflow-hidden rounded-b-none sm:rounded-b-xl">
          <EditorContent editor={editor} />
          <EditorImageBubbleMenu editor={editor} readOnly={readOnly} />
          {!readOnly && (
            <EditorSelectionToolbar
              editor={editor}
              ai={ai}
              onOpenAiPanel={() => setAiOpen(true)}
              showAiActions={showAi}
            />
          )}
        </div>

        {variant === "owner" && <NoteBacklinks noteId={noteId} />}

        {showHistory && (
          <VersionHistoryPanel
            noteId={noteId}
            editor={editor}
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            onRestored={handleVersionRestored}
          />
        )}
      </div>

      {showAi && aiOpen && (
        <div className="w-full shrink-0 lg:w-80">
          <EditorAiSidebar
            noteTitle={title}
            onClose={() => setAiOpen(false)}
            ai={ai}
          />
        </div>
      )}
    </div>
  );
}
