"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** Saving in progress, disables input and shows a spinner */
  pending?: boolean;
  className?: string;
};

/**
 * Minimal underline input: Enter submits, Escape cancels, autofocus on mount.
 */
export function InlineCreateField({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder,
  disabled,
  pending,
  className,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const busy = Boolean(disabled || pending);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-1.5", className)}>
      <input
        ref={ref}
        type="text"
        value={value}
        disabled={busy}
        placeholder={placeholder}
        aria-busy={pending || undefined}
        aria-label={placeholder ?? "Name"}
        className={cn(
          "min-w-0 flex-1 border-0 border-b border-zinc-300/90 bg-transparent py-1 text-[13px] text-zinc-900 outline-none",
          "placeholder:text-zinc-400 focus:border-zinc-500",
          "dark:border-zinc-600 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400",
          busy && "cursor-not-allowed opacity-60",
          pending && "pointer-events-none"
        )}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (pending) return;
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
      />
      {pending ? (
        <Loader2
          className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-500 dark:text-zinc-400"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
