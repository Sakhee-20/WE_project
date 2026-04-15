"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Copy,
  ExternalLink,
  MoreHorizontal,
  PencilLine,
  Star,
  Trash2,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

function absoluteUrl(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (typeof window === "undefined") return href;
  return `${window.location.origin}${href.startsWith("/") ? href : `/${href}`}`;
}

type Props = {
  /** Display name for clipboard fallbacks */
  label: string;
  href?: string | null;
  className?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void | Promise<void>;
  onRename?: () => void;
  onDelete?: () => void;
};

export function SidebarItemMoreMenu({
  label,
  href,
  className,
  isFavorite,
  onFavoriteToggle,
  onRename,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuW = 192;
    let left = r.right - menuW;
    left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8));
    const top = Math.min(r.bottom + 4, window.innerHeight - 8);
    setPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const copyLink = href
    ? () => void copyText(absoluteUrl(href))
    : undefined;
  const openNewTab = href
    ? () => {
        window.open(absoluteUrl(href), "_blank", "noopener,noreferrer");
        setOpen(false);
      }
    : undefined;

  const menuItemClass =
    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-zinc-700 transition-[background-color,color] duration-150 ease-out hover:bg-zinc-200/50 active:bg-zinc-200/70 dark:text-zinc-200 dark:hover:bg-zinc-800/50 dark:active:bg-zinc-800/70";
  const destructiveMenuItemClass =
    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-red-600 transition-[background-color,color] duration-150 ease-out hover:bg-red-50 active:bg-red-100/90 dark:text-red-400 dark:hover:bg-red-950/50 dark:active:bg-red-950/70";

  const favoriteLabel = isFavorite ? "Remove from favorites" : "Add to favorites";

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[200] min-w-[12rem] overflow-hidden rounded-lg border border-zinc-200/70 bg-white px-1 py-1.5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] motion-safe:animate-slide-up motion-reduce:animate-fade-in dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_4px_28px_-6px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)]"
      style={{ top: pos.top, left: pos.left }}
    >
      {onFavoriteToggle !== undefined && isFavorite !== undefined ? (
        <button
          type="button"
          role="menuitem"
          className={cn(menuItemClass, "mx-0.5")}
          onClick={() => {
            void Promise.resolve(onFavoriteToggle()).finally(() => setOpen(false));
          }}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5 shrink-0 opacity-65",
              isFavorite && "fill-amber-400 text-amber-500 opacity-100 dark:fill-amber-400/90 dark:text-amber-400"
            )}
            aria-hidden
          />
          {favoriteLabel}
        </button>
      ) : null}
      {onFavoriteToggle !== undefined && isFavorite !== undefined ? (
        <div className="my-1 border-t border-zinc-100/90 dark:border-zinc-800/90" />
      ) : null}
      {onRename ? (
        <button
          type="button"
          role="menuitem"
          className={cn(menuItemClass, "mx-0.5")}
          onClick={() => {
            onRename();
            setOpen(false);
          }}
        >
          <PencilLine className="h-3.5 w-3.5 shrink-0 opacity-65" aria-hidden />
          Rename
        </button>
      ) : null}
      {onRename ? (
        <div className="my-1 border-t border-zinc-100/90 dark:border-zinc-800/90" />
      ) : null}
      {onDelete ? (
        <button
          type="button"
          role="menuitem"
          className={cn(destructiveMenuItemClass, "mx-0.5")}
          onClick={() => {
            onDelete();
            setOpen(false);
          }}
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          Delete
        </button>
      ) : null}
      {onDelete ? (
        <div className="my-1 border-t border-zinc-100/90 dark:border-zinc-800/90" />
      ) : null}
      {copyLink ? (
        <button
          type="button"
          role="menuitem"
          className={cn(menuItemClass, "mx-0.5")}
          onClick={() => void copyLink()}
        >
          <Copy className="h-3.5 w-3.5 shrink-0 opacity-65" aria-hidden />
          Copy link
        </button>
      ) : null}
      {openNewTab ? (
        <button
          type="button"
          role="menuitem"
          className={cn(menuItemClass, "mx-0.5")}
          onClick={openNewTab}
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-65" aria-hidden />
          Open in new tab
        </button>
      ) : null}
      {copyLink || openNewTab ? (
        <div className="my-1 border-t border-zinc-100/90 dark:border-zinc-800/90" />
      ) : null}
      <button
        type="button"
        role="menuitem"
        className={cn(menuItemClass, "mx-0.5")}
        onClick={() => void copyText(label)}
      >
        <Type className="h-3.5 w-3.5 shrink-0 opacity-65" aria-hidden />
        Copy title
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500",
          "transition-[opacity,background-color,color] duration-200 ease-in-out",
          "hover:bg-zinc-200/70 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-zinc-100",
          "max-md:opacity-100 max-md:pointer-events-auto",
          "md:opacity-0 md:pointer-events-none",
          "md:group-hover/sidebar-row:opacity-100 md:group-hover/sidebar-row:pointer-events-auto",
          "md:group-focus-within/sidebar-row:opacity-100 md:group-focus-within/sidebar-row:pointer-events-auto",
          "focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 dark:focus-visible:ring-zinc-500/35",
          open && "opacity-100 pointer-events-auto",
          className
        )}
        aria-label={`More actions for ${label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </>
  );
}
