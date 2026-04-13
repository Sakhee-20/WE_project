"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import type { NoteImageAlign } from "./note-image-extension";

function clampWidthPercent(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(100, Math.max(15, Math.round(n)));
}

function imgStyleForWidth(widthPercent: number): import("react").CSSProperties {
  const wp = clampWidthPercent(widthPercent);
  if (wp < 100) {
    return {
      maxWidth: `min(100%, ${wp}%)`,
      height: "auto",
      display: "block",
    };
  }
  return { maxWidth: "100%", height: "auto", display: "block" };
}

export function NoteImageView({
  editor,
  node,
  updateAttributes,
  selected,
  HTMLAttributes,
}: NodeViewProps) {
  const { src, alt, title, widthPercent, align, caption } = node.attrs as {
    src: string;
    alt?: string;
    title?: string;
    widthPercent?: number;
    align?: NoteImageAlign;
    caption?: string;
  };

  const alignSafe: NoteImageAlign = align ?? "center";
  const wp =
    typeof widthPercent === "number" &&
    widthPercent > 0 &&
    widthPercent <= 100
      ? widthPercent
      : 100;

  const imgRef = useRef<HTMLImageElement>(null);
  const [previewPercent, setPreviewPercent] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPercentRef = useRef<number | null>(null);

  const effectiveWp = previewPercent ?? wp;

  const baseClass =
    typeof HTMLAttributes?.class === "string" ? HTMLAttributes.class : "";
  const imgClassName = ["note-editor-img", baseClass].filter(Boolean).join(" ");

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const schedulePreview = useCallback((next: number) => {
    const clamped = clampWidthPercent(next);
    lastPercentRef.current = clamped;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setPreviewPercent(clamped);
    });
  }, []);

  const startResize = useCallback(
    (edge: "right" | "left", e: React.PointerEvent<HTMLDivElement>) => {
      if (!editor.isEditable) return;
      e.preventDefault();
      e.stopPropagation();
      const img = imgRef.current;
      const prose = editor.view.dom as HTMLElement | null;
      if (!img || !prose) return;

      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);

      const startX = e.clientX;
      const startW = img.getBoundingClientRect().width;
      const proseW = Math.max(1, prose.getBoundingClientRect().width);
      lastPercentRef.current = null;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const delta = edge === "right" ? dx : -dx;
        const newW = Math.max(40, startW + delta);
        const pct = (newW / proseW) * 100;
        schedulePreview(pct);
      };

      const onUp = (ev: PointerEvent) => {
        try {
          target.releasePointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        const final = lastPercentRef.current;
        lastPercentRef.current = null;
        setPreviewPercent(null);
        if (final != null) {
          updateAttributes({ widthPercent: final });
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [editor.isEditable, editor.view.dom, schedulePreview, updateAttributes]
  );

  const cap = String(caption ?? "").trim();
  const showFigcaption = cap.length > 0;

  return (
    <NodeViewWrapper
      as="figure"
      className={`note-editor-figure note-editor-figure--align-${alignSafe}`}
    >
      <div className="note-editor-image-frame relative inline-block max-w-full">
        <img
          ref={imgRef}
          src={src}
          alt={alt ?? ""}
          title={title ?? undefined}
          draggable={false}
          className={imgClassName}
          style={imgStyleForWidth(effectiveWp)}
          data-width-percent={
            effectiveWp < 100
              ? String(clampWidthPercent(effectiveWp))
              : undefined
          }
        />
        {selected && editor.isEditable ? (
          <>
            <div
              className="note-editor-resize-handle note-editor-resize-handle--br"
              contentEditable={false}
              onPointerDown={(e) => startResize("right", e)}
              role="separator"
              aria-label="Resize image from corner"
            />
            <div
              className="note-editor-resize-handle note-editor-resize-handle--bl"
              contentEditable={false}
              onPointerDown={(e) => startResize("left", e)}
              role="separator"
              aria-label="Resize image from corner"
            />
          </>
        ) : null}
      </div>
      {showFigcaption ? (
        <figcaption className="note-editor-figcaption">{cap}</figcaption>
      ) : null}
    </NodeViewWrapper>
  );
}
