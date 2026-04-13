"use client";

import { mergeInclusiveRanges } from "@/lib/fuse-highlight-utils";

const markClass =
  "rounded-sm bg-amber-200/95 px-0.5 text-inherit dark:bg-amber-500/35";

type HighlightedTextProps = {
  text: string;
  /** Inclusive [start, end] character indices (Fuse-style). */
  ranges: ReadonlyArray<readonly [number, number]>;
};

export function HighlightedText({ text, ranges }: HighlightedTextProps) {
  const merged = mergeInclusiveRanges(ranges);
  if (!text) return null;
  if (merged.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let pos = 0;
  let key = 0;
  for (const [s, e] of merged) {
    const start = Math.max(0, Math.min(s, text.length));
    const end = Math.max(start, Math.min(e + 1, text.length));
    if (start > pos) {
      parts.push(text.slice(pos, start));
    }
    if (end > start) {
      parts.push(
        <mark key={key++} className={markClass}>
          {text.slice(start, end)}
        </mark>
      );
    }
    pos = end;
  }
  if (pos < text.length) {
    parts.push(text.slice(pos));
  }
  return <>{parts}</>;
}
