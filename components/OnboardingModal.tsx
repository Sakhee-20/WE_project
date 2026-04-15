"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { BookMarked, Keyboard, Sparkles, X } from "lucide-react";
import { MOTION_BUTTON_PRESS } from "@/lib/motion-classes";
import { cn } from "@/lib/utils";

type Props = {
  /** When true, first-time onboarding modal is shown until completed or skipped. */
  active: boolean;
};

const STEPS = [
  {
    title: "Welcome",
    body: "This is your study hub. Create subjects and chapters, then capture notes with a rich editor, images, AI helpers, and sharing.",
    icon: Sparkles,
  },
  {
    title: "Organize",
    body: "Start from the dashboard: add a subject, open it, and add chapters. Each chapter holds your notes.",
    icon: BookMarked,
  },
  {
    title: "Search anywhere",
    body: "Press Cmd+K (or Ctrl+K) to search across all your notes by note title, subject name, or text inside the note.",
    icon: Keyboard,
  },
];

export function OnboardingModal({ active }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!active || dismissed) return null;

  const Icon = STEPS[step].icon;
  const isLast = step === STEPS.length - 1;

  async function finish() {
    setSaving(true);
    try {
      await fetch("/api/me/onboarding", { method: "POST" });
      setDismissed(true);
      router.refresh();
    } catch {
      setSaving(false);
    }
  }

  async function skip() {
    await finish();
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl motion-safe:animate-fade-in motion-reduce:animate-none dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => void skip()}
          className={cn(
            "absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200",
            MOTION_BUTTON_PRESS
          )}
          aria-label="Skip onboarding"
        >
          <X className="h-4 w-4" />
        </button>

        <div
          key={step}
          className="motion-safe:animate-fade-in motion-reduce:animate-none"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Icon className="h-6 w-6" aria-hidden />
          </div>

          <h2
            id="onboarding-title"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            {STEPS[step].title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {STEPS[step].body}
          </p>

          {step === 1 ? (
            <p className="mt-3 text-sm">
              <Link
                href="/dashboard"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Go to dashboard
              </Link>{" "}
              when you are ready to add your first subject.
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={[
                  "h-1.5 w-6 rounded-full transition-colors",
                  i === step ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-700",
                ].join(" ")}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className={cn(
                  "rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800",
                  MOTION_BUTTON_PRESS
                )}
              >
                Back
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className={cn(
                  "rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-500",
                  MOTION_BUTTON_PRESS
                )}
              >
                Next
              </button>
            )}
            {isLast && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void finish()}
                className={cn(
                  "rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500",
                  MOTION_BUTTON_PRESS
                )}
              >
                {saving ? "Saving…" : "Get started"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
