/**
 * Shared micro-interaction classes. Use `motion-safe:` so hover/active motion
 * is skipped when the user prefers reduced motion (see also `motion-reduce:`).
 */
export const MOTION_BUTTON_PRESS =
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out motion-safe:hover:scale-105 motion-safe:active:scale-95";

/** Sidebar rail width / mobile slide; no scale (full-width control). */
export const MOTION_SIDEBAR_LAYOUT =
  "transition-[width] duration-300 ease-out motion-reduce:transition-none";

/** Mobile sidebar slide; slightly longer duration reads smoother on touch devices. */
export const MOTION_SIDEBAR_DRAWER =
  "transform-gpu transition-[transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform motion-reduce:transition-none";
