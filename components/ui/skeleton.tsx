import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /** When true, use a left-to-right shimmer (respects prefers-reduced-motion). */
  shimmer?: boolean;
};

export function Skeleton({
  className,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-zinc-200/70 dark:bg-zinc-800/80",
        shimmer &&
          "motion-safe:animate-shimmer motion-safe:bg-[length:200%_100%] motion-safe:bg-gradient-to-r motion-safe:from-zinc-200/40 motion-safe:via-zinc-200 motion-safe:to-zinc-200/40 dark:motion-safe:from-zinc-800/40 dark:motion-safe:via-zinc-700 dark:motion-safe:to-zinc-800/40 motion-reduce:!animate-none motion-reduce:!bg-zinc-200/75 dark:motion-reduce:!bg-zinc-800/85",
        className
      )}
      {...props}
    />
  );
}
