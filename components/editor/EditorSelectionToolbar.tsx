"use client";

import type { ReactNode } from "react";
import { BubbleMenu } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, Code, Loader2 } from "lucide-react";
import type { AiAction } from "@/lib/validations/ai";
import type { UseAiAssistantReturn } from "./use-ai-assistant";
import { cn } from "@/lib/utils";

const AI_QUICK_ACTIONS: {
  action: AiAction;
  label: string;
  title: string;
}[] = [
  {
    action: "explain_selection",
    label: "Explain",
    title: "Explain selection",
  },
  {
    action: "summarize_selection",
    label: "Summarize",
    title: "Summarize selection",
  },
  {
    action: "fix_grammar_selection",
    label: "Grammar",
    title: "Fix grammar and spelling",
  },
];

type Props = {
  editor: Editor | null;
  ai: UseAiAssistantReturn;
  onOpenAiPanel: () => void;
  /** When false, only formatting controls are shown (inline bold, italic, code). */
  showAiActions?: boolean;
};

function shouldShowSelectionToolbar(editor: Editor): boolean {
  if (!editor.isEditable) return false;
  if (editor.isActive("image")) return false;
  const { from, to } = editor.state.selection;
  return from !== to;
}

export function EditorSelectionToolbar({
  editor,
  ai,
  onOpenAiPanel,
  showAiActions = true,
}: Props) {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="selectionFloatingToolbar"
      shouldShow={({ editor: ed }) => shouldShowSelectionToolbar(ed)}
      tippyOptions={{
        duration: 150,
        maxWidth: "none",
        zIndex: 45,
        moveTransition: "transform 0.12s ease-out",
      }}
      className="!m-0"
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-0.5 rounded-xl border p-1 shadow-lg backdrop-blur-sm",
          "border-zinc-200/90 bg-white/95 dark:border-zinc-600/90 dark:bg-zinc-900/95"
        )}
        role="toolbar"
        aria-label="Text formatting and AI"
      >
        <span className="flex items-center gap-0.5">
          <ToolbarIconButton
            title="Bold"
            active={editor.isActive("bold")}
            disabled={!editor.can().toggleBold()}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3.5 w-3.5" aria-hidden />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Italic"
            active={editor.isActive("italic")}
            disabled={!editor.can().toggleItalic()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-3.5 w-3.5" aria-hidden />
          </ToolbarIconButton>
          <ToolbarIconButton
            title="Inline code"
            active={editor.isActive("code")}
            disabled={!editor.can().toggleCode()}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="h-3.5 w-3.5" aria-hidden />
          </ToolbarIconButton>
        </span>

        {showAiActions && (
          <>
            <span
              className="mx-0.5 h-5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-600"
              aria-hidden
            />
            <span className="flex items-center gap-0.5">
              <span className="sr-only">AI</span>
              {AI_QUICK_ACTIONS.map(({ action, label, title }) => (
                <button
                  key={action}
                  type="button"
                  title={title}
                  disabled={ai.loading !== null}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onOpenAiPanel();
                    void ai.run(action);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors",
                    "text-violet-800 hover:bg-violet-100 disabled:opacity-50",
                    "dark:text-violet-200 dark:hover:bg-violet-950/80"
                  )}
                >
                  {ai.loading === action ? (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      aria-label="Loading"
                    />
                  ) : null}
                  {label}
                </button>
              ))}
            </span>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}

function ToolbarIconButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-700 transition-colors",
        "hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-30",
        "dark:text-zinc-200 dark:hover:bg-zinc-800",
        active && "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white"
      )}
    >
      {children}
    </button>
  );
}
