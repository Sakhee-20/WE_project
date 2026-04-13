"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FabricCanvas,
  type BoardTool,
  type FabricCanvasHandle,
} from "./FabricCanvas";
import {
  MousePointer2,
  Pencil,
  Highlighter,
  Square,
  Circle,
  MoveUpRight,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Save,
  FileText,
  LayoutDashboard,
} from "lucide-react";

type BoardPayload = {
  id: string;
  canvasJson: unknown;
  textContent: string | null;
};

function asRecord(json: unknown): Record<string, unknown> | null {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return null;
}

export function WhiteboardClient({ board }: { board: BoardPayload }) {
  const [mode, setMode] = useState<"text" | "board">("board");
  const [tool, setTool] = useState<BoardTool>("select");
  const [text, setText] = useState(board.textContent ?? "");
  const [canvasKey, setCanvasKey] = useState(0);
  const [saveHint, setSaveHint] = useState<"idle" | "saving" | "saved">("idle");

  const canvasJsonRef = useRef<Record<string, unknown>>(
    asRecord(board.canvasJson) ?? { version: "5.3.0", objects: [] }
  );
  const fabricRef = useRef<FabricCanvasHandle>(null);
  const saveTimerRef = useRef<number | null>(null);
  const textTimerRef = useRef<number | null>(null);

  const persist = useCallback(
    async (opts?: { canvasJson?: Record<string, unknown> }) => {
      const canvasJson =
        opts?.canvasJson ??
        (mode === "board" && fabricRef.current
          ? fabricRef.current.getJSON()
          : canvasJsonRef.current);

      setSaveHint("saving");
      try {
        const res = await fetch("/api/whiteboard", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            canvasJson,
            textContent: text,
          }),
        });
        if (!res.ok) throw new Error("Save failed");
        canvasJsonRef.current = canvasJson;
        setSaveHint("saved");
        window.setTimeout(() => setSaveHint("idle"), 2000);
      } catch {
        setSaveHint("idle");
      }
    },
    [mode, text]
  );

  const scheduleCanvasSave = useCallback(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void persist();
    }, 2000);
  }, [persist]);

  const onCanvasChange = useCallback(
    (json: Record<string, unknown>) => {
      canvasJsonRef.current = json;
      scheduleCanvasSave();
    },
    [scheduleCanvasSave]
  );

  useEffect(() => {
    if (mode !== "text") return;
    if (textTimerRef.current) window.clearTimeout(textTimerRef.current);
    textTimerRef.current = window.setTimeout(() => {
      void persist();
    }, 1500);
    return () => {
      if (textTimerRef.current) window.clearTimeout(textTimerRef.current);
    };
  }, [text, mode, persist]);

  const switchToText = () => {
    if (fabricRef.current) {
      canvasJsonRef.current = fabricRef.current.getJSON();
    }
    setMode("text");
  };

  const switchToBoard = () => {
    setMode("board");
    setCanvasKey((k) => k + 1);
  };

  const confirmClearCanvas = () => {
    if (
      !window.confirm(
        "Clear everything on the canvas? This removes all drawings and shapes. You can press Undo (Ctrl+Z) afterward to restore."
      )
    ) {
      return;
    }
    fabricRef.current?.clearCanvas();
  };

  const toolBtn = (
    t: BoardTool,
    label: string,
    icon: React.ReactNode,
    active?: boolean
  ) => (
    <button
      key={t}
      type="button"
      title={label}
      onClick={() => setTool(t)}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-md border text-zinc-700",
        active
          ? "border-blue-500 bg-blue-50 text-blue-800"
          : "border-zinc-200 bg-white hover:bg-zinc-50",
      ].join(" ")}
    >
      {icon}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Whiteboard</h1>
          <p className="text-sm text-zinc-500">
            Draw, annotate, or switch to text mode for quick notes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5">
            <button
              type="button"
              onClick={switchToBoard}
              className={[
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                mode === "board"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900",
              ].join(" ")}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Board mode
            </button>
            <button
              type="button"
              onClick={switchToText}
              className={[
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                mode === "text"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900",
              ].join(" ")}
            >
              <FileText className="h-3.5 w-3.5" />
              Text mode
            </button>
          </div>
          <button
            type="button"
            onClick={() => void persist()}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
          >
            <Save className="h-3.5 w-3.5" />
            Save now
          </button>
          <span className="text-xs text-zinc-500 tabular-nums min-w-[4.5rem] text-right">
            {saveHint === "saving" && "Saving…"}
            {saveHint === "saved" && "Saved ✓"}
          </span>
        </div>
      </div>

      {mode === "text" && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[520px] w-full rounded-lg border border-zinc-200 bg-white p-4 font-mono text-sm text-zinc-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="Write notes here…"
          spellCheck
        />
      )}

      {mode === "board" && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm">
            <div className="flex flex-wrap gap-1 border-r border-zinc-100 pr-2">
              <button
                type="button"
                title="Undo"
                onClick={() => fabricRef.current?.undo()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Redo"
                onClick={() => fabricRef.current?.redo()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              >
                <Redo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Clear canvas"
                onClick={confirmClearCanvas}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-2 text-xs font-medium text-red-700 hover:bg-red-50 sm:px-2.5"
              >
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Clear canvas</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {toolBtn(
                "select",
                "Select / move",
                <MousePointer2 className="h-4 w-4" />,
                tool === "select"
              )}
              {toolBtn(
                "draw",
                "Pen",
                <Pencil className="h-4 w-4" />,
                tool === "draw"
              )}
              {toolBtn(
                "highlight",
                "Highlighter",
                <Highlighter className="h-4 w-4" />,
                tool === "highlight"
              )}
              {toolBtn(
                "rect",
                "Rectangle",
                <Square className="h-4 w-4" />,
                tool === "rect"
              )}
              {toolBtn(
                "circle",
                "Circle",
                <Circle className="h-4 w-4" />,
                tool === "circle"
              )}
              {toolBtn(
                "arrow",
                "Arrow",
                <MoveUpRight className="h-4 w-4" />,
                tool === "arrow"
              )}
              {toolBtn(
                "text",
                "Text box",
                <Type className="h-4 w-4" />,
                tool === "text"
              )}
            </div>
          </div>

          <FabricCanvas
            key={canvasKey}
            ref={fabricRef}
            initialCanvas={canvasJsonRef.current}
            activeTool={tool}
            onChange={onCanvasChange}
          />
        </>
      )}
    </div>
  );
}
