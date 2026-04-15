import { cn } from "@/lib/utils";

/** Single full-width row (quick links, favorites, etc.). */
export function sidebarRowClass(options: { active?: boolean } = {}): string {
  const { active = false } = options;
  return cn(
    "flex w-full min-w-0 items-center gap-1.5 rounded-md border-l-2 border-l-transparent py-2.5 pl-2 pr-2.5 text-[13px] leading-snug tracking-[-0.01em]",
    "min-h-[44px] lg:min-h-0",
    "transition-[background-color,color,border-color] duration-200 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/35 focus-visible:ring-offset-1 dark:focus-visible:ring-zinc-500/40 dark:focus-visible:ring-offset-zinc-950",
    active
      ? "border-l-zinc-400 bg-zinc-100/95 font-medium text-zinc-900 dark:border-l-zinc-500 dark:bg-zinc-800 dark:text-zinc-100"
      : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
  );
}

/**
 * Outer shell for tree rows that include a trailing "…" menu.
 * Background and hover live on the shell so the menu sits in the same pill.
 */
export function sidebarTreeRowShellClass(
  options: { active?: boolean; favorited?: boolean } = {}
) {
  const { active = false, favorited = false } = options;
  return cn(
    "group/sidebar-row flex w-full min-w-0 items-center gap-0 rounded-md border border-transparent pr-0.5",
    "border-l-2 transition-[background-color,border-color] duration-200 ease-in-out",
    active && favorited
      ? "border-l-amber-500 bg-amber-50/90 dark:border-l-amber-400 dark:bg-zinc-800"
      : active
        ? "border-l-zinc-400 bg-zinc-100/95 dark:border-l-zinc-500 dark:bg-zinc-800"
        : favorited
          ? "border-l-amber-400/80 bg-amber-50/70 hover:bg-amber-100/80 dark:border-l-amber-500/50 dark:bg-amber-950/25 dark:hover:bg-amber-950/40"
          : "border-l-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-800/55"
  );
}

/** Inner link or trigger inside {@link sidebarTreeRowShellClass}. */
export function sidebarTreeRowMainClass(
  options: { active?: boolean; favorited?: boolean } = {}
) {
  const { active = false, favorited = false } = options;
  return cn(
    "flex min-w-0 flex-1 items-center gap-1.5 rounded-md py-2.5 pl-2.5 pr-1 text-left text-[13px] leading-snug tracking-[-0.01em]",
    "min-h-[44px] lg:min-h-0",
    "transition-[color,font-weight] duration-200 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/35 focus-visible:ring-offset-0 dark:focus-visible:ring-zinc-500/40",
    active
      ? "font-medium text-zinc-900 dark:text-zinc-100"
      : favorited
        ? "font-medium text-amber-950 dark:text-amber-100"
        : "text-zinc-600 dark:text-zinc-400"
  );
}

/** Indent per depth (Notion-style). */
const INDENT: Record<number, string> = {
  0: "",
  1: "pl-2",
  2: "pl-5",
  3: "pl-8",
  4: "pl-11",
};

export function sidebarIndentClass(depth: number): string {
  return INDENT[Math.min(depth, 4)] ?? INDENT[4];
}
