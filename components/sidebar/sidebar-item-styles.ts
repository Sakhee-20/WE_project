import { cn } from "@/lib/utils";

/** Single full-width row (quick links, etc.). */
export function sidebarRowClass(options: { active?: boolean } = {}): string {
  const { active = false } = options;
  return cn(
    "flex w-full min-w-0 items-center gap-1.5 rounded-md px-2.5 py-[7px] text-[13px] leading-snug tracking-[-0.01em] transition-[background-color,color,transform] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/35 focus-visible:ring-offset-1 dark:focus-visible:ring-zinc-500/40 dark:focus-visible:ring-offset-zinc-950",
    active
      ? "bg-zinc-200/75 font-medium text-zinc-900 dark:bg-zinc-800/85 dark:text-zinc-50"
      : "text-zinc-600 hover:bg-zinc-200/55 hover:text-zinc-900 motion-safe:active:scale-[0.99] dark:text-zinc-400 dark:hover:bg-zinc-800/55 dark:hover:text-zinc-100"
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
    "group/sidebar-row flex w-full min-w-0 items-center gap-0 rounded-md border border-transparent pr-0.5 transition-[background-color,box-shadow] duration-200 ease-out",
    active && favorited
      ? "bg-zinc-200/80 shadow-[inset_3px_0_0_0_rgb(245_158_11_0.75)] dark:bg-zinc-800/80 dark:shadow-[inset_3px_0_0_0_rgb(251_191_36_0.55)]"
      : active
        ? "bg-zinc-200/80 shadow-[inset_2px_0_0_0_rgb(113_113_122)] dark:bg-zinc-800/80 dark:shadow-[inset_2px_0_0_0_rgb(161_161_170)]"
        : favorited
          ? "bg-amber-50/85 shadow-[inset_3px_0_0_0_rgb(245_158_11_0.55)] hover:bg-amber-100/70 dark:bg-amber-950/35 dark:shadow-[inset_3px_0_0_0_rgb(251_191_36_0.45)] dark:hover:bg-amber-950/50"
          : "hover:bg-zinc-200/45 dark:hover:bg-zinc-800/45"
  );
}

/** Inner link or trigger inside {@link sidebarTreeRowShellClass}. */
export function sidebarTreeRowMainClass(
  options: { active?: boolean; favorited?: boolean } = {}
) {
  const { active = false, favorited = false } = options;
  return cn(
    "flex min-w-0 flex-1 items-center gap-1.5 rounded-md py-[7px] pl-2.5 pr-1 text-left text-[13px] leading-snug tracking-[-0.01em] transition-colors duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/35 focus-visible:ring-offset-0 dark:focus-visible:ring-zinc-500/40",
    active
      ? "font-medium text-zinc-900 dark:text-zinc-50"
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
