/**
 * Shared elevated card surfaces: soft border, light shadow, subtle hover lift.
 * Light mode uses zinc-200 borders; dark mode uses zinc-800.
 */
export const CARD_ELEVATED =
  "rounded-2xl border border-zinc-200/80 bg-white/90 backdrop-blur-sm shadow-[0_18px_40px_-24px_rgba(30,60,140,0.35)] transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:border-zinc-300/85 dark:border-zinc-700/70 dark:bg-zinc-900/75 dark:hover:border-zinc-600/85 motion-safe:hover:-translate-y-[2px] motion-safe:hover:shadow-[0_24px_48px_-26px_rgba(120,90,255,0.45)] motion-reduce:hover:translate-y-0";

/** Padding for primary blocks (stats, storage, hero cards). */
export const CARD_PADDING_BLOCK = "p-4 sm:p-6";

/** Padding for list-style cards and dense rows. */
export const CARD_PADDING_ROW = "p-4 sm:p-5";

/**
 * Note editor outer shell: full-bleed on small screens, elevated card from `sm` up.
 */
export const CARD_NOTE_SHELL =
  "min-w-0 flex-1 rounded-none border-y border-zinc-200/85 bg-white/95 shadow-none transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out sm:rounded-2xl sm:border sm:border-zinc-200/85 sm:shadow-[0_18px_40px_-26px_rgba(30,60,140,0.35)] sm:hover:border-zinc-300/85 dark:border-zinc-700/70 dark:bg-zinc-900/75 dark:sm:hover:border-zinc-600/85 motion-safe:sm:hover:-translate-y-[2px] motion-safe:sm:hover:shadow-[0_24px_48px_-26px_rgba(120,90,255,0.45)] motion-reduce:sm:hover:translate-y-0";
