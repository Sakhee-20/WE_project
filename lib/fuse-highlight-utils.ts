/**
 * Merge overlapping or adjacent [start, end] ranges (inclusive indices, Fuse-style).
 */
export function mergeInclusiveRanges(
  ranges: ReadonlyArray<readonly [number, number]>
): [number, number][] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges]
    .map(([a, b]) => [Math.min(a, b), Math.max(a, b)] as [number, number])
    .sort((x, y) => x[0] - y[0]);
  const out: [number, number][] = [];
  let cur = sorted[0]!;
  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i]!;
    if (r[0] <= cur[1] + 1) {
      cur = [cur[0], Math.max(cur[1], r[1])];
    } else {
      out.push(cur);
      cur = r;
    }
  }
  out.push(cur);
  return out;
}

export type TextSnippet = {
  text: string;
  highlightRanges: [number, number][];
};

/**
 * Cut a window around the first match so long note bodies stay readable in the UI.
 */
export function snippetAroundFirstMatch(
  full: string,
  indices: ReadonlyArray<readonly [number, number]>,
  contextBefore = 44,
  contextAfter = 96
): TextSnippet {
  if (!full) return { text: "", highlightRanges: [] };
  const merged = mergeInclusiveRanges(indices);
  if (merged.length === 0) {
    const cap = 140;
    return {
      text: full.length > cap ? `${full.slice(0, cap)}…` : full,
      highlightRanges: [],
    };
  }
  const first = merged[0]!;
  const last = merged[merged.length - 1]!;
  const start = Math.max(0, first[0] - contextBefore);
  const end = Math.min(full.length, last[1] + 1 + contextAfter);
  const slice = full.slice(start, end);
  const highlightRanges = mergeInclusiveRanges(
    merged
      .map(([s, e]) => [s - start, e - start] as [number, number])
      .filter(([s, e]) => e >= 0 && s < slice.length)
      .map(([s, e]) => [
        Math.max(0, s),
        Math.min(slice.length - 1, e),
      ] as [number, number])
  );
  return { text: slice, highlightRanges };
}
