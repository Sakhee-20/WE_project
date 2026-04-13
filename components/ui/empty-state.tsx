import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  illustration?: ReactNode;
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
};

export function EmptyState({
  illustration,
  title,
  description,
  className,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-zinc-200/90 bg-gradient-to-b from-zinc-50/80 to-white px-5 py-10 text-center shadow-sm dark:border-zinc-700/80 dark:from-zinc-900/40 dark:to-zinc-950/30 sm:px-8",
        className
      )}
    >
      {illustration ? (
        <div className="mb-4 opacity-90 transition-opacity duration-300 hover:opacity-100">
          {illustration}
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {children ? <div className="mt-5 w-full max-w-xs">{children}</div> : null}
    </div>
  );
}
