"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { NoteImageEditor } from "./note-image-editor";
import { EditorImageBubbleMenu } from "./EditorImageBubbleMenu";
import type { JSONContent } from "@tiptap/core";
import { EditorToolbar } from "./EditorToolbar";
import { ImageUploadExtension } from "./image-upload-extension";
import { SlashCommandExtension } from "./slash-command-extension";
import { WikiLinkExtension } from "./wiki-link-extension";
import { uploadNoteImage } from "@/lib/editor/upload-image-client";
import { broadcastSubjectsTreeInvalidation } from "@/lib/subjects-tree-events";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { EditorAiSidebar } from "./EditorAiSidebar";
import { EditorSelectionToolbar } from "./EditorSelectionToolbar";
import { useAiAssistant } from "./use-ai-assistant";
import { NoteSharePanel } from "./NoteSharePanel";
import { History } from "lucide-react";
import { NoteBacklinks } from "./NoteBacklinks";

const NOTE_EDITOR_SHELL =
  "min-w-0 flex-1 rounded-none border-y border-zinc-200/85 bg-white/95 shadow-none transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out sm:rounded-2xl sm:border sm:border-zinc-200/85 sm:shadow-[0_18px_40px_-26px_rgba(30,60,140,0.35)] sm:hover:border-zinc-300/85 dark:border-zinc-800 dark:bg-zinc-900 dark:sm:hover:border-zinc-700 motion-safe:sm:hover:-translate-y-[2px] motion-safe:sm:hover:shadow-[0_24px_48px_-26px_rgba(120,90,255,0.35)] motion-reduce:sm:hover:translate-y-0";

const AUTOSAVE_MS = 30_000;

type Props = {
  noteId: string;
  initialTitle: string;
  initialContent: JSONContent;
  autoFocusTitle?: boolean;
};

export function NoteEditorClassic({
  noteId,
  initialTitle,
  initialContent,
  autoFocusTitle = false,
}: Props) {
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

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start writing…",
      }),
      NoteImageEditor.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class:
            "max-w-full h-auto rounded-lg border border-zinc-200 my-3 shadow-sm",
        },
      }),
      ImageUploadExtension.configure({
        noteId,
        getOnProgress: () => setUploadProgress,
      }),
      SlashCommandExtension.configure({
        onRequestImageUpload: () => fileInputRef.current?.click(),
      }),
      WikiLinkExtension.configure({
        excludeNoteId: noteId,
      }),
    ],
    [noteId]
  );

  const editor = useEditor(
    {
      extensions,
      content: initialContent,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "note-editor-content",
        },
      },
    },
    [extensions]
  );

  const ai = useAiAssistant({ noteId, editor });

  const insertImageFromFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploadProgress(0);
      try {
        const { url } = await uploadNoteImage(file, noteId, (p) =>
          setUploadProgress(p)
        );
        editor.chain().focus().setImage({ src: url }).run();
      } catch (e) {
        console.error(e);
      } finally {
        setUploadProgress(null);
      }
    },
    [editor, noteId]
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
    if (!editor) return;
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
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: currentTitle, content: doc }),
      });

      if (!res.ok) {
        setSaveState("idle");
        return;
      }

      snapshot.current = { title: currentTitle, contentJson };
      if (prevTitle !== currentTitle) {
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
  }, [editor, noteId]);

  useEffect(() => {
    if (!editor) return;
    const id = window.setInterval(() => {
      void persist();
    }, AUTOSAVE_MS);
    return () => window.clearInterval(id);
  }, [editor, persist]);

  useEffect(() => {
    return () => {
      if (savedClearRef.current) window.clearTimeout(savedClearRef.current);
    };
  }, []);

  useEffect(() => {
    if (!autoFocusTitle) return;
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
  }, [autoFocusTitle, noteId]);

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start">
      <div className={NOTE_EDITOR_SHELL}>
        <div className="flex flex-col gap-2 border-b border-zinc-100 px-2.5 py-2.5 sm:gap-3 sm:px-4 sm:py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full min-w-0 border-0 bg-transparent text-lg font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500 sm:text-xl"
            placeholder="Untitled"
            aria-label="Note title"
          />
          <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <NoteSharePanel noteId={noteId} />
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              title="Version history"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 sm:px-2.5 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <History className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Version history</span>
            </button>
            <div
              className="min-w-[5rem] text-right text-sm tabular-nums text-zinc-500 dark:text-zinc-400"
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
          </div>
        </div>

        <EditorToolbar
          editor={editor}
          noteId={noteId}
          onInsertImageClick={() => fileInputRef.current?.click()}
          imageUploadBusy={uploadProgress !== null}
          onAiClick={() => setAiOpen((o) => !o)}
          aiPanelOpen={aiOpen}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={onImageInputChange}
        />

        {uploadProgress !== null && (
          <div className="border-t border-zinc-100 bg-zinc-50/80 px-2.5 py-2 sm:px-4 dark:border-zinc-800 dark:bg-zinc-900/70">
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
              <span>Uploading image</span>
              <span className="tabular-nums font-medium">
                {uploadProgress}%
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
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

        <div className="note-editor-shell relative overflow-hidden rounded-b-none bg-white/90 dark:bg-zinc-900/80 sm:rounded-b-xl">
          <EditorContent editor={editor} />
          <EditorImageBubbleMenu editor={editor} />
          <EditorSelectionToolbar
            editor={editor}
            ai={ai}
            onOpenAiPanel={() => setAiOpen(true)}
            showAiActions
          />
        </div>

        <div className="border-t border-zinc-100 px-3 py-3 dark:border-zinc-800 sm:px-4">
          <NoteBacklinks noteId={noteId} />
        </div>

        <VersionHistoryPanel
          noteId={noteId}
          editor={editor}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          onRestored={handleVersionRestored}
        />
      </div>

      {aiOpen && (
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
