"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  PenSquare,
  X,
} from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { MOTION_BUTTON_PRESS } from "@/lib/motion-classes";
import { cn } from "@/lib/utils";
import { useMobileSidebar } from "./mobile-sidebar-context";

type Props = {
  userLabel: string;
};

export function AppHeader({ userLabel }: Props) {
  const { mobileOpen, toggleMobileSidebar, closeMobileSidebar } =
    useMobileSidebar();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [moreOpen]);

  return (
    <header className="sticky top-0 z-[60] min-w-0 border-b border-zinc-200/90 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mx-auto flex h-14 w-full min-w-0 max-w-full items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 lg:max-w-6xl lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleMobileSidebar}
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 md:hidden dark:text-zinc-100 dark:hover:bg-zinc-800",
              MOTION_BUTTON_PRESS
            )}
            aria-expanded={mobileOpen}
            aria-controls="app-sidebar-nav"
            aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>

          <Link
            href="/dashboard"
            className="min-w-0 shrink truncate rounded-md font-semibold tracking-tight text-zinc-900 transition-opacity duration-200 hover:opacity-80 dark:text-zinc-100"
            onClick={() => closeMobileSidebar()}
          >
            WE Project
          </Link>

          <nav
            className="ml-2 hidden min-w-0 items-center gap-4 lg:flex lg:gap-6"
            aria-label="Primary"
          >
            <Link
              href="/dashboard"
              className="shrink-0 rounded-md px-2 py-1.5 text-sm text-zinc-600 transition-[background-color,color] duration-200 ease-out hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Dashboard
            </Link>
            <Link
              href="/whiteboard"
              className="shrink-0 rounded-md px-2 py-1.5 text-sm text-zinc-600 transition-[background-color,color] duration-200 ease-out hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Whiteboard
            </Link>
          </nav>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2 lg:gap-3">
          <CommandPalette />
          <ThemeToggle />

          <span className="hidden max-w-[min(10rem,28vw)] truncate text-sm text-zinc-500 lg:inline dark:text-zinc-400">
            {userLabel}
          </span>

          <span className="hidden lg:inline">
            <SignOutButton />
          </span>

          <div className="relative lg:hidden" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={cn(
                "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                MOTION_BUTTON_PRESS,
                moreOpen && "bg-zinc-100 dark:bg-zinc-800"
              )}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              aria-label="Menu"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden />
            </button>
            {moreOpen ? (
              <div
                className="absolute right-0 top-full z-[70] mt-1 w-[min(17rem,calc(100vw-1rem))] overflow-hidden rounded-lg border border-zinc-200/90 bg-white py-1 shadow-lg motion-safe:animate-fade-in dark:border-zinc-800 dark:bg-zinc-900"
                role="menu"
              >
                <Link
                  href="/dashboard"
                  role="menuitem"
                  className="flex min-h-[44px] items-center gap-2 px-3 py-2 text-sm text-zinc-700 transition-colors duration-200 ease-out hover:bg-zinc-100 lg:min-h-0 lg:py-2.5 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => {
                    setMoreOpen(false);
                    closeMobileSidebar();
                  }}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0 opacity-80" />
                  Dashboard
                </Link>
                <Link
                  href="/whiteboard"
                  role="menuitem"
                  className="flex min-h-[44px] items-center gap-2 px-3 py-2 text-sm text-zinc-700 transition-colors duration-200 ease-out hover:bg-zinc-100 lg:min-h-0 lg:py-2.5 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => {
                    setMoreOpen(false);
                    closeMobileSidebar();
                  }}
                >
                  <PenSquare className="h-4 w-4 shrink-0 opacity-80" />
                  Whiteboard
                </Link>
                <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="block truncate" title={userLabel}>
                    {userLabel}
                  </span>
                </div>
                <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
                  <SignOutButton />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
