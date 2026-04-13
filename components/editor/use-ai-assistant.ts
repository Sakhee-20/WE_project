"use client";

import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AI_SELECTION_ACTIONS,
  type AiAction,
} from "@/lib/validations/ai";
import { tryFormatJson } from "@/lib/ai/format-ai-output";

const JSON_OUTPUT_ACTIONS = new Set<AiAction>([
  "generate_quiz",
  "generate_flashcards",
  "generate_flashcards_selection",
]);

export function getSelectedPlainText(editor: Editor | null): string | null {
  if (!editor) return null;
  const { from, to } = editor.state.selection;
  if (from === to) return null;
  const t = editor.state.doc.textBetween(from, to, "\n").trim();
  return t.length ? t : null;
}

export type UseAiAssistantReturn = {
  run: (action: AiAction) => Promise<void>;
  loading: AiAction | null;
  error: string | null;
  output: string | null;
  lastAction: AiAction | null;
  clearOutput: () => void;
};

export function useAiAssistant(opts: {
  noteId: string;
  editor: Editor | null;
}): UseAiAssistantReturn {
  const { noteId, editor } = opts;
  const [loading, setLoading] = useState<AiAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<AiAction | null>(null);

  const clearOutput = useCallback(() => {
    setOutput(null);
    setError(null);
    setLastAction(null);
  }, []);

  const run = useCallback(
    async (action: AiAction) => {
      setError(null);
      setLoading(action);
      setLastAction(action);

      let selectedText: string | undefined;
      if (AI_SELECTION_ACTIONS.has(action)) {
        const t = getSelectedPlainText(editor);
        if (!t) {
          setError("Select some text in the note first.");
          setLoading(null);
          return;
        }
        selectedText = t;
      }

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            noteId,
            ...(selectedText !== undefined ? { selectedText } : {}),
          }),
        });

        const data = (await res.json()) as { error?: string; output?: string };

        if (!res.ok) {
          setOutput(null);
          setError(data.error || "Something went wrong.");
          return;
        }

        if (typeof data.output !== "string") {
          setOutput(null);
          setError("Unexpected response from server.");
          return;
        }

        const display = JSON_OUTPUT_ACTIONS.has(action)
          ? tryFormatJson(data.output)
          : data.output;

        setOutput(display);
      } catch {
        setOutput(null);
        setError("Network error. Check your connection.");
      } finally {
        setLoading(null);
      }
    },
    [editor, noteId]
  );

  return { run, loading, error, output, lastAction, clearOutput };
}
