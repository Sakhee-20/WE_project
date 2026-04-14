"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { useIsMd } from "@/lib/hooks/use-is-md";

type Props = {
  children: React.ReactNode;
};

/**
 * Resizable sidebar on md+; slide-in drawer below header on small screens.
 */
export function AppLayout({ children }: Props) {
  const { mobileOpen, closeMobileSidebar } = useMobileSidebar();
  const isMd = useIsMd();

  useEffect(() => {
    if (isMd) closeMobileSidebar();
  }, [isMd, closeMobileSidebar]);

  return (
    <div className="relative flex min-h-0 w-full min-w-0 flex-1 overflow-x-hidden">
      {mobileOpen && !isMd ? (
        <button
          type="button"
          className="app-sidebar-backdrop fixed inset-x-0 bottom-0 top-14 z-[45] bg-zinc-950/55 backdrop-blur-[2px] md:hidden"
          aria-label="Close sidebar"
          onClick={closeMobileSidebar}
        />
      ) : null}

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden bg-zinc-50 dark:bg-zinc-950">
        <main className="relative min-h-0 w-full min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
