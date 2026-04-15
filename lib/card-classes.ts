/**
 * Shared elevated card surfaces: soft border, light shadow, subtle hover lift.
 * Light mode uses zinc-200 borders; dark mode uses zinc-800.
 */
export const CARD_ELEVATED =
  "rounded-xl border border-zinc-200/90 bg-white shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-zinc-300/85 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-800 motion-safe:hover:-translate-y-[2px] motion-safe:hover:shadow-md motion-reduce:hover:translate-y-0 dark:motion-safe:hover:shadow-lg dark:motion-safe:hover:shadow-zinc-950/30";

/** Padding for primary blocks (stats, storage, hero cards). */
export const CARD_PADDING_BLOCK = "p-4 sm:p-6";

/** Padding for list-style cards and dense rows. */
export const CARD_PADDING_ROW = "p-4 sm:p-5";

/**
 * Note editor outer shell: full-bleed on small screens, elevated card from `sm` up.
 */
export const CARD_NOTE_SHELL =
  "min-w-0 flex-1 rounded-none border-y border-zinc-200/90 bg-white shadow-none transition-[transform,box-shadow,border-color] duration-200 ease-out sm:rounded-xl sm:border sm:border-zinc-200/90 sm:shadow-sm sm:hover:border-zinc-300/85 dark:border-zinc-800 dark:bg-zinc-900 dark:sm:hover:border-zinc-800 motion-safe:sm:hover:-translate-y-[2px] motion-safe:sm:hover:shadow-md motion-reduce:sm:hover:translate-y-0 dark:motion-safe:sm:hover:shadow-lg dark:motion-safe:sm:hover:shadow-zinc-950/30";
