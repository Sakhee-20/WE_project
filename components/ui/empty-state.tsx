import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Optional large illustration (SVG or image) shown above the title. */
  illustration?: ReactNode;
  /** Small decorative icon in a muted circle when you do not use a full illustration. */
  icon?: ReactNode;
  title: string;
  description: string;
  /** Primary call to action (e.g. button) below the description. */
  action?: ReactNode;
  className?: string;
  /** Extra content below the action (e.g. sidebar inline create field). */
  children?: ReactNode;
  /** Tighter padding for narrow panels (e.g. sidebar). */
  size?: "default" | "compact";
};

export function EmptyState({
  illustration,
  icon,
  title,
  description,
  action,
  className,
  children,
  size = "default",
}: Props) {
  const compact = size === "compact";

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center text-center",
        "border border-dashed border-zinc-200/70 bg-gradient-to-b from-zinc-50/60 to-zinc-50/30",
        "dark:border-zinc-800/70 dark:from-zinc-900/35 dark:to-zinc-950/20",
        "rounded-xl shadow-sm motion-safe:hover:-translate-y-[2px] motion-safe:hover:shadow-md motion-reduce:hover:translate-y-0",
        compact
          ? "px-4 py-6 sm:px-5 sm:py-9"
          : "px-4 py-8 sm:px-6 sm:py-10 md:px-10 md:py-14",
        "motion-safe:animate-fade-in motion-reduce:animate-none",
        className
      )}
    >
      {illustration ? (
        <div
          className={cn(
            "flex justify-center text-zinc-400 dark:text-zinc-500",
            compact ? "mb-4" : "mb-6"
          )}
        >
          <div className="rounded-xl bg-zinc-100/90 p-3 ring-1 ring-inset ring-zinc-200/60 dark:bg-zinc-800/50 dark:ring-zinc-700/40">
            {illustration}
          </div>
        </div>
      ) : icon ? (
        <div
          className={cn(
            "flex justify-center text-zinc-400 dark:text-zinc-500",
            compact ? "mb-4" : "mb-6"
          )}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100/90 ring-1 ring-inset ring-zinc-200/60 dark:bg-zinc-800/50 dark:ring-zinc-700/40"
            aria-hidden
          >
            {icon}
          </div>
        </div>
      ) : null}

      <h3
        className={cn(
          "max-w-md font-semibold tracking-tight text-zinc-800 dark:text-zinc-200",
          compact ? "text-[13px] leading-snug" : "text-base"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-2 max-w-md text-pretty leading-relaxed text-zinc-500 dark:text-zinc-400",
          compact ? "text-[12px]" : "text-sm"
        )}
      >
        {description}
      </p>

      {action || children ? (
        <div
          className={cn(
            "flex w-full max-w-sm flex-col items-center gap-3",
            compact ? "mt-5" : "mt-8"
          )}
        >
          {action}
          {children}
        </div>
      ) : null}
    </div>
  );
}
