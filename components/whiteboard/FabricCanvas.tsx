"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";

export type BoardTool =
  | "select"
  | "draw"
  | "highlight"
  | "rect"
  | "circle"
  | "arrow"
  | "text";

export type FabricCanvasHandle = {
  undo: () => void;
  redo: () => void;
  getJSON: () => Record<string, unknown>;
  loadJSON: (data: Record<string, unknown>) => void;
  /** Removes all objects, restores default background, resets undo history. */
  clearCanvas: () => void;
};

const HISTORY_CAP = 80;
const CANVAS_BG = "#fafafa";

function cloneJson(canvas: import("fabric").fabric.Canvas) {
  return canvas.toJSON([
    "selectable",
    "evented",
    "strokeUniform",
    "strokeLineCap",
    "strokeLineJoin",
  ]) as Record<string, unknown>;
}

export const FabricCanvas = forwardRef<
  FabricCanvasHandle,
  {
    initialCanvas: Record<string, unknown> | null;
    activeTool: BoardTool;
    onChange: (json: Record<string, unknown>) => void;
  }
>(function FabricCanvas({ initialCanvas, activeTool, onChange }, ref) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<typeof import("fabric").fabric | null>(null);
  const canvasRef = useRef<import("fabric").fabric.Canvas | null>(null);
  const activeToolRef = useRef<BoardTool>(activeTool);
  activeToolRef.current = activeTool;

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const pushingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const undoRef = useRef<() => void>(() => {});
  const redoRef = useRef<() => void>(() => {});

  const shapeState = useRef<{
    active: boolean;
    obj: import("fabric").fabric.Object | null;
    startX: number;
    startY: number;
  }>({ active: false, obj: null, startX: 0, startY: 0 });

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || pushingRef.current) return;
    const snap = JSON.stringify(cloneJson(canvas));
    const hist = historyRef.current;
    const idx = historyIndexRef.current;
    if (hist[idx] === snap) return;
    const next = hist.slice(0, idx + 1);
    next.push(snap);
    if (next.length > HISTORY_CAP) next.shift();
    historyRef.current = next;
    historyIndexRef.current = next.length - 1;
    onChangeRef.current(cloneJson(canvas));
  }, []);

  const schedulePush = useCallback(() => {
    if (pushingRef.current) return;
    window.setTimeout(() => pushHistory(), 120);
  }, [pushHistory]);

  const applyTool = useCallback((tool: BoardTool) => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric) return;

    const isFreeDrawing = tool === "draw" || tool === "highlight";

    canvas.isDrawingMode = isFreeDrawing;
    canvas.selection = tool === "select";
    canvas.skipTargetFind = isFreeDrawing;
    canvas.defaultCursor =
      tool === "text"
        ? "text"
        : tool === "select"
          ? "default"
          : "crosshair";
    canvas.forEachObject((o) => {
      o.selectable = !isFreeDrawing;
      o.evented = !isFreeDrawing;
    });

    if (tool === "draw") {
      const b = new fabric.PencilBrush(canvas);
      b.color = "#111827";
      b.width = 2;
      canvas.freeDrawingBrush = b;
    } else if (tool === "highlight") {
      const b = new fabric.PencilBrush(canvas);
      b.color = "rgba(255, 235, 59, 0.35)";
      b.width = 24;
      canvas.freeDrawingBrush = b;
    }
  }, []);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const idx = historyIndexRef.current;
    if (idx <= 0) return;
    pushingRef.current = true;
    historyIndexRef.current = idx - 1;
    const json = JSON.parse(historyRef.current[idx - 1]) as Record<
      string,
      unknown
    >;
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
      pushingRef.current = false;
      applyTool(activeToolRef.current);
      onChangeRef.current(cloneJson(canvas));
    });
  }, [applyTool]);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx >= hist.length - 1) return;
    pushingRef.current = true;
    historyIndexRef.current = idx + 1;
    const json = JSON.parse(hist[idx + 1]) as Record<string, unknown>;
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
      pushingRef.current = false;
      applyTool(activeToolRef.current);
      onChangeRef.current(cloneJson(canvas));
    });
  }, [applyTool]);

  const getJSON = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { version: "5.3.0", objects: [] };
    return cloneJson(canvas);
  }, []);

  const loadJSON = useCallback(
    (data: Record<string, unknown>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      pushingRef.current = true;
      canvas.loadFromJSON(data, () => {
        canvas.renderAll();
        const snap = JSON.stringify(cloneJson(canvas));
        historyRef.current = [snap];
        historyIndexRef.current = 0;
        pushingRef.current = false;
        applyTool(activeToolRef.current);
        onChangeRef.current(cloneJson(canvas));
      });
    },
    [applyTool]
  );

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const beforeClear = JSON.stringify(cloneJson(canvas));
    canvas.clear();
    canvas.backgroundColor = CANVAS_BG;
    canvas.renderAll();
    const afterClear = JSON.stringify(cloneJson(canvas));
    historyRef.current = [beforeClear, afterClear];
    historyIndexRef.current = 1;
    applyTool(activeToolRef.current);
    onChangeRef.current(cloneJson(canvas));
  }, [applyTool]);

  useImperativeHandle(
    ref,
    () => ({ undo, redo, getJSON, loadJSON, clearCanvas }),
    [undo, redo, getJSON, loadJSON, clearCanvas]
  );

  undoRef.current = undo;
  redoRef.current = redo;

  useEffect(() => {
    applyTool(activeTool);
  }, [activeTool, applyTool]);

  useEffect(() => {
    const el = canvasElRef.current;
    if (!el) return;

    let disposed = false;
    let disposeCanvas: (() => void) | null = null;

    const startData =
      initialCanvas && typeof initialCanvas === "object"
        ? initialCanvas
        : { version: "5.3.0", objects: [] };

    void import("fabric").then((mod) => {
      if (disposed || !canvasElRef.current) return;
      const fabric = mod.fabric;
      fabricRef.current = fabric;

      const width = () =>
        Math.max(
          640,
          Math.floor(wrapRef.current?.getBoundingClientRect().width ?? 800)
        );

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: width(),
        height: 520,
        backgroundColor: CANVAS_BG,
        preserveObjectStacking: true,
      });
      canvasRef.current = canvas;

      canvas.loadFromJSON(startData, () => {
        canvas.renderAll();
        const snap = JSON.stringify(cloneJson(canvas));
        historyRef.current = [snap];
        historyIndexRef.current = 0;
      });

      canvas.on("object:added", schedulePush);
      canvas.on("object:modified", schedulePush);
      canvas.on("object:removed", schedulePush);
      canvas.on("path:created", schedulePush);

      const onResize = () => {
        canvas.setWidth(width());
        canvas.renderAll();
      };
      window.addEventListener("resize", onResize);

      const inFormField = (target: EventTarget | null) => {
        const el = target as HTMLElement | null;
        return !!el?.closest(
          "input, textarea, select, [contenteditable='true'], [contenteditable='']"
        );
      };

      const skipCanvasShortcutsForTextEdit = () => {
        const active = canvas.getActiveObject();
        if (!active) return false;
        if (active.type === "i-text" || active.type === "textbox") {
          const textObj = active as import("fabric").fabric.IText;
          if (textObj.isEditing) return true;
        }
        return false;
      };

      const onKeyDown = (e: KeyboardEvent) => {
        const t = e.target;
        const mod = e.ctrlKey || e.metaKey;

        if (mod && (e.key === "z" || e.key === "Z")) {
          if (inFormField(t)) return;
          if (skipCanvasShortcutsForTextEdit()) return;
          e.preventDefault();
          if (e.shiftKey) {
            redoRef.current();
          } else {
            undoRef.current();
          }
          return;
        }

        if (mod && (e.key === "y" || e.key === "Y")) {
          if (inFormField(t)) return;
          if (skipCanvasShortcutsForTextEdit()) return;
          e.preventDefault();
          redoRef.current();
          return;
        }

        if (e.key !== "Delete" && e.key !== "Backspace") return;

        if (inFormField(t)) return;

        if (canvas.isDrawingMode) return;

        const active = canvas.getActiveObject();
        if (!active) return;

        if (active.type === "i-text" || active.type === "textbox") {
          const textObj = active as import("fabric").fabric.IText;
          if (textObj.isEditing) return;
        }

        e.preventDefault();
        const toRemove = canvas.getActiveObjects();
        toRemove.forEach((obj) => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.renderAll();
        schedulePush();
      };
      window.addEventListener("keydown", onKeyDown);

      const pointerDown = (opt: {
        e?: MouseEvent | TouchEvent;
        target?: import("fabric").fabric.Object | null;
      }) => {
        const tool = activeToolRef.current;
        if (
          tool !== "rect" &&
          tool !== "circle" &&
          tool !== "arrow" &&
          tool !== "text"
        ) {
          return;
        }
        if (canvas.isDrawingMode) return;
        if (opt.target) return;
        const e = opt.e;
        if (!e) return;
        const p = canvas.getPointer(e);

        if (tool === "text") {
          const t = new fabric.IText("Type here", {
            left: p.x,
            top: p.y,
            fontSize: 18,
            fill: "#111827",
            fontFamily: "system-ui, sans-serif",
          });
          canvas.add(t);
          canvas.setActiveObject(t);
          t.enterEditing();
          canvas.requestRenderAll();
          schedulePush();
          return;
        }

        shapeState.current = {
          active: true,
          obj: null,
          startX: p.x,
          startY: p.y,
        };

        if (tool === "rect") {
          const r = new fabric.Rect({
            left: p.x,
            top: p.y,
            width: 0,
            height: 0,
            fill: "transparent",
            stroke: "#111827",
            strokeWidth: 2,
          });
          shapeState.current.obj = r;
          canvas.add(r);
        } else if (tool === "circle") {
          const c = new fabric.Ellipse({
            left: p.x,
            top: p.y,
            rx: 0,
            ry: 0,
            fill: "transparent",
            stroke: "#111827",
            strokeWidth: 2,
            originX: "left",
            originY: "top",
          });
          shapeState.current.obj = c;
          canvas.add(c);
        } else if (tool === "arrow") {
          const line = new fabric.Line([p.x, p.y, p.x, p.y], {
            stroke: "#111827",
            strokeWidth: 2,
          });
          shapeState.current.obj = line;
          canvas.add(line);
        }
      };

      const pointerMove = (opt: { e?: MouseEvent | TouchEvent }) => {
        const st = shapeState.current;
        if (!st.active || !st.obj) return;
        const e = opt.e;
        if (!e) return;
        const p = canvas.getPointer(e);
        const sx = st.startX;
        const sy = st.startY;

        if (st.obj.type === "rect") {
          const r = st.obj as import("fabric").fabric.Rect;
          const left = Math.min(sx, p.x);
          const top = Math.min(sy, p.y);
          r.set({
            left,
            top,
            width: Math.abs(p.x - sx),
            height: Math.abs(p.y - sy),
          });
        } else if (st.obj.type === "ellipse") {
          const c = st.obj as import("fabric").fabric.Ellipse;
          const left = Math.min(sx, p.x);
          const top = Math.min(sy, p.y);
          c.set({
            left,
            top,
            rx: Math.abs(p.x - sx) / 2,
            ry: Math.abs(p.y - sy) / 2,
          });
        } else if (st.obj.type === "line") {
          const ln = st.obj as import("fabric").fabric.Line;
          ln.set({ x1: sx, y1: sy, x2: p.x, y2: p.y });
        }
        canvas.requestRenderAll();
      };

      const pointerUp = () => {
        const st = shapeState.current;
        if (!st.active) return;
        st.active = false;

        if (st.obj && st.obj.type === "line") {
          const ln = st.obj as import("fabric").fabric.Line;
          const x1 = ln.x1 ?? 0;
          const y1 = ln.y1 ?? 0;
          const x2 = ln.x2 ?? 0;
          const y2 = ln.y2 ?? 0;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.hypot(dx, dy);
          if (len > 8) {
            const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
            const head = new fabric.Triangle({
              left: x2,
              top: y2,
              width: 14,
              height: 18,
              fill: "#111827",
              angle: angleDeg + 90,
              originX: "center",
              originY: "center",
            });
            canvas.add(head);
          }
        }

        st.obj = null;
        canvas.requestRenderAll();
        schedulePush();
      };

      canvas.on("mouse:down", pointerDown);
      canvas.on("mouse:move", pointerMove);
      canvas.on("mouse:up", pointerUp);

      applyTool(activeToolRef.current);

      disposeCanvas = () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("keydown", onKeyDown);
        canvas.off();
        canvas.dispose();
        canvasRef.current = null;
        fabricRef.current = null;
      };

      if (disposed) disposeCanvas();
    });

    return () => {
      disposed = true;
      disposeCanvas?.();
    };
    // Mount once per component instance; parent should remount with key when server data arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapRef}
      tabIndex={-1}
      onMouseDownCapture={() => wrapRef.current?.focus()}
      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-500/45 dark:focus-visible:ring-offset-zinc-950"
    >
      <canvas ref={canvasElRef} className="block max-w-full" />
    </div>
  );
});

FabricCanvas.displayName = "FabricCanvas";
