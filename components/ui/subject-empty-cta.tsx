"use client";

import { Library } from "lucide-react";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-context";
import { WE_OPEN_NEW_SUBJECT_EVENT } from "@/lib/workspace-events";
import { useIsMd } from "@/lib/hooks/use-is-md";
import { Button } from "@/components/ui/button";

export function SubjectEmptyCta() {
  const { setMobileOpen } = useMobileSidebar();
  const isMd = useIsMd();

  const onClick = () => {
    if (!isMd) {
      setMobileOpen(true);
    }
    window.dispatchEvent(new CustomEvent(WE_OPEN_NEW_SUBJECT_EVENT));
    requestAnimationFrame(() => {
      document
        .getElementById("app-sidebar-nav")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="min-w-[12rem] border-zinc-200/90 bg-white/80 text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
      onClick={onClick}
    >
      <Library className="h-4 w-4 opacity-80" aria-hidden />
      Create your first subject
    </Button>
  );
}
