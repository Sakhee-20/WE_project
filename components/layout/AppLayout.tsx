"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { useIsMd } from "@/lib/hooks/use-is-md";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
};

/**
 * Resizable sidebar on md+; slide-in drawer below header on small screens.
 */
export function AppLayout({ children }: Props) {
  const pathname = usePathname();
  const { mobileOpen, closeMobileSidebar } = useMobileSidebar();
  const isMd = useIsMd();

  useEffect(() => {
    if (isMd) closeMobileSidebar();
  }, [isMd, closeMobileSidebar]);

  useEffect(() => {
    // On mobile, close the drawer after route changes.
    if (mobileOpen && !isMd) {
      closeMobileSidebar();
    }
  }, [pathname, mobileOpen, isMd, closeMobileSidebar]);

  return (
    <div className="relative flex min-h-0 w-full min-w-0 max-w-[100vw] flex-1 overflow-x-hidden">
      {mobileOpen && !isMd ? (
        <button
          type="button"
          className="app-sidebar-backdrop fixed inset-x-0 bottom-0 top-14 z-[45] bg-zinc-950/60 backdrop-blur-[3px] motion-safe:transition-opacity motion-safe:duration-300 md:hidden"
          aria-label="Close sidebar"
          onClick={closeMobileSidebar}
        />
      ) : null}

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden bg-zinc-50/40 dark:bg-zinc-950/20">
        <main className="relative min-h-0 w-full min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-7">
          <div
            key={pathname}
            className={cn(
              "min-w-0",
              "motion-safe:animate-fade-in motion-reduce:animate-none"
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
