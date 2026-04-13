import { NextResponse } from "next/server";
import { APIError } from "@anthropic-ai/sdk";
import type { JSONContent } from "@tiptap/core";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-session";
import { handleApiError } from "@/lib/api-errors";
import {
  aiRequestSchema,
  AI_SELECTION_ACTIONS,
} from "@/lib/validations/ai";
import { tiptapJsonToPlainText } from "@/lib/tiptap/json-to-plain-text";
import { completeClaude } from "@/lib/ai/claude";

export const dynamic = "force-dynamic";

const MAX_NOTE_CHARS = 100_000;

const JSON_ACTIONS = new Set([
  "generate_quiz",
  "generate_flashcards",
  "generate_flashcards_selection",
]);

export async function POST(request: Request) {
  try {
    const auth = await requireSession();
    if (auth.error) return auth.error;

    const json = await request.json();
    const body = aiRequestSchema.parse(json);

    const note = await prisma.note.findFirst({
      where: {
        id: body.noteId,
        chapter: { subject: { userId: auth.user.id } },
      },
      select: { title: true, content: true },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const plain = tiptapJsonToPlainText(note.content as JSONContent);
    const noteBody =
      plain.length > MAX_NOTE_CHARS
        ? `${plain.slice(0, MAX_NOTE_CHARS)}\n\n[truncated for length]`
        : plain;

    const selectionOnly = AI_SELECTION_ACTIONS.has(body.action);
    if (!selectionOnly && !noteBody.trim()) {
      return NextResponse.json(
        { error: "This note is empty. Add some content first." },
        { status: 400 }
      );
    }

    const title = note.title || "Untitled";
    const passage = body.selectedText?.trim() ?? "";

    let output: string;

    switch (body.action) {
      case "summarize_note": {
        output = await completeClaude(
          "You summarize study notes for students. Be accurate and concise. Use short paragraphs or bullet points where helpful. Do not invent facts that are not in the note.",
          `Note title: ${title}\n\nNote content:\n${noteBody}`
        );
        break;
      }
      case "explain_eli5": {
        output = await completeClaude(
          "You explain ideas to a five year old. Use very simple words, short sentences, and friendly tone. Use analogies only when they help. Stay accurate to the passage. Do not talk down in a condescending way.",
          `Note title: ${title}\n\nFull note (for light context only):\n${noteBody}\n\n---\nExplain this part like I am five:\n${passage}`
        );
        break;
      }
      case "explain_selection": {
        output = await completeClaude(
          "You explain study material clearly for a student. Use plain language and short paragraphs. Stay accurate to the passage only. Do not invent facts. No preamble like 'Here is an explanation'.",
          `Note title: ${title}\n\nFull note (light context only):\n${noteBody}\n\n---\nExplain this passage:\n${passage}`
        );
        break;
      }
      case "convert_bullets": {
        output = await completeClaude(
          "Rewrite the user's text as clear bullet points. Use lines starting with '- ' (markdown bullets). Keep every important fact. No title line unless the original had one. No preamble or closing.",
          `Note title: ${title}\n\nConvert to bullet points:\n${passage}`
        );
        break;
      }
      case "summarize_selection": {
        output = await completeClaude(
          "Summarize the passage in 2 to 5 short sentences. Be accurate. Do not add information that is not in the passage.",
          `Note title: ${title}\n\nFull note (optional context):\n${noteBody}\n\n---\nPassage to summarize:\n${passage}`
        );
        break;
      }
      case "fix_grammar_selection": {
        output = await completeClaude(
          "Fix grammar, spelling, and punctuation in the passage. Preserve meaning and tone. Keep the same language as the original. Reply with only the corrected text, no quotes or commentary.",
          `Note title: ${title}\n\nPassage to fix:\n${passage}`
        );
        break;
      }
      case "generate_quiz": {
        output = await completeClaude(
          'You write study quizzes. Reply with ONLY valid JSON (no markdown code fences, no commentary). Shape: {"questions":[{"question":"string","options":["A","B","C","D"],"correctIndex":0} ...]}. Use exactly four options per question. correctIndex is 0-3. Write 5 to 8 questions based on how much material there is. Questions must be answerable from the note.',
          `Note title: ${title}\n\nNote content:\n${noteBody}`
        );
        break;
      }
      case "generate_flashcards": {
        output = await completeClaude(
          'You make flashcards. Reply with ONLY valid JSON (no markdown fences, no commentary). Shape: {"cards":[{"front":"string","back":"string"} ...]}. Create 8 to 15 cards depending on how much material there is. Front is a term or question, back is the answer.',
          `Note title: ${title}\n\nNote content:\n${noteBody}`
        );
        break;
      }
      case "generate_flashcards_selection": {
        output = await completeClaude(
          'You make flashcards from a short passage. Reply with ONLY valid JSON (no markdown fences, no commentary). Shape: {"cards":[{"front":"string","back":"string"} ...]}. Create 4 to 12 cards based on how much material is in the passage. Front is a term or question, back is the answer. Only use information from the passage.',
          `Note title: ${title}\n\nPassage:\n${passage}`
        );
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ output, action: body.action });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ANTHROPIC_API_KEY_MISSING"
    ) {
      return NextResponse.json(
        { error: "AI is not configured. Set ANTHROPIC_API_KEY on the server." },
        { status: 503 }
      );
    }

    if (error instanceof APIError) {
      console.error("[api/ai] Anthropic", error.status, error.message);
      return NextResponse.json(
        {
          error:
            error.status === 429
              ? "AI rate limit reached. Try again in a moment."
              : "The AI service returned an error. Try again later.",
        },
        { status: 502 }
      );
    }

    return handleApiError(error);
  }
}
