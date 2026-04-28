"use client";

import type { AiAction } from "@/lib/validations/ai";
import { Loader2, X } from "lucide-react";
import type { UseAiAssistantReturn } from "./use-ai-assistant";

type Props = {
  noteTitle: string;
  onClose: () => void;
  ai: UseAiAssistantReturn;
};

const ACTION_LABELS: Record<AiAction, string> = {
  summarize_note: "Generate summary",
  generate_quiz: "Quiz (JSON)",
  generate_flashcards: "Create flashcards",
  explain_eli5: "Explain like I'm 5",
  explain_selection: "Explain selection",
  convert_bullets: "Convert to bullet points",
  summarize_selection: "Summarize selection",
  fix_grammar_selection: "Fix grammar",
  generate_flashcards_selection: "Flashcards from selection",
};

const WHOLE_NOTE_ACTIONS: AiAction[] = [
  "summarize_note",
  "generate_quiz",
  "generate_flashcards",
];

const SELECTION_ACTIONS: AiAction[] = [
  "explain_selection",
  "summarize_selection",
  "fix_grammar_selection",
  "explain_eli5",
  "convert_bullets",
  "generate_flashcards_selection",
];

function ActionRow(props: {
  actions: AiAction[];
  ai: UseAiAssistantReturn;
}) {
  const { actions, ai } = props;
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          disabled={ai.loading !== null}
          onClick={() => void ai.run(action)}
          className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-violet-900 shadow-sm ring-1 ring-violet-200/80 hover:bg-violet-100 disabled:opacity-50 dark:bg-zinc-900 dark:text-violet-200 dark:ring-violet-800/70 dark:hover:bg-violet-900/40"
        >
          {ai.loading === action ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              {ACTION_LABELS[action]}
            </span>
          ) : (
            ACTION_LABELS[action]
          )}
        </button>
      ))}
    </div>
  );
}

export function EditorAiSidebar({ noteTitle, onClose, ai }: Props) {
  const { error, output, lastAction, loading } = ai;

  return (
    <aside
      className="flex h-[min(70vh,640px)] flex-col rounded-xl border border-violet-200/80 bg-gradient-to-b from-violet-50/90 to-white shadow-sm dark:border-violet-900/70 dark:from-zinc-900 dark:to-zinc-950 lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)] lg:max-h-[calc(100vh-6rem)]"
      aria-label="AI assistant"
    >
      <div className="flex items-center justify-between gap-2 border-b border-violet-100 px-3 py-2.5 dark:border-violet-900/60">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            AI
          </p>
          <p
            className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100"
            title={noteTitle}
          >
            {noteTitle || "Untitled"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-zinc-500 hover:bg-violet-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-violet-900/40 dark:hover:text-zinc-100"
          title="Close panel"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="space-y-2 border-b border-violet-50 px-2 py-2 dark:border-violet-900/40">
        <div>
          <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Whole note
          </p>
          <ActionRow actions={WHOLE_NOTE_ACTIONS} ai={ai} />
        </div>
        <div>
          <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Selection
          </p>
          <ActionRow actions={SELECTION_ACTIONS} ai={ai} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {error && (
          <div
            className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        {output === null && !error && loading === null && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Use whole-note actions or select text and pick a selection action.
            The floating bar also runs selection actions. Quiz and flashcards
            return JSON you can copy.
          </p>
        )}

        {output !== null && (
          <div className="space-y-2">
            {lastAction && (
              <p className="text-xs font-medium text-violet-700 dark:text-violet-300">
                {ACTION_LABELS[lastAction]}
              </p>
            )}
            <pre className="whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-xs leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100">
              {output}
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
}
