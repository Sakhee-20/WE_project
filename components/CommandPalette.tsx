"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { BookMarked, FileText, Library, Search } from "lucide-react";
import type { CommandPaletteItem } from "@/lib/search/types";
import { cn } from "@/lib/utils";

const FUSE_LIMIT = 32;
const EMPTY_LIMIT = 24;

function defaultPaletteResults(
  items: CommandPaletteItem[],
  limit: number
): CommandPaletteItem[] {
  const notes = items
    .filter((i) => i.kind === "note")
    .sort((a, b) => {
      const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      return tb - ta;
    });
  const subjects = items.filter((i) => i.kind === "subject");
  const chapters = items.filter((i) => i.kind === "chapter");
  const out: CommandPaletteItem[] = [];
  for (const n of notes) {
    if (out.length >= limit) break;
    out.push(n);
  }
  for (const s of subjects) {
    if (out.length >= limit) break;
    out.push(s);
  }
  for (const c of chapters) {
    if (out.length >= limit) break;
    out.push(c);
  }
  return out.slice(0, limit);
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CommandPaletteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadIndex = useCallback(async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/search-index");
      const data = (await res.json()) as { items?: CommandPaletteItem[] };
      setItems(Array.isArray(data.items) ? data.items : []);
      setLoaded(true);
    } catch {
      setItems([]);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [loaded, loading]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      void loadIndex();
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, loadIndex]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: "title", weight: 0.4 },
          { name: "meta", weight: 0.25 },
          { name: "snippet", weight: 0.35 },
        ],
        threshold: 0.42,
        ignoreLocation: true,
        minMatchCharLength: 1,
        includeScore: true,
      }),
    [items]
  );

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) {
      return defaultPaletteResults(items, EMPTY_LIMIT);
    }
    return fuse.search(q, { limit: FUSE_LIMIT }).map((r) => r.item);
  }, [fuse, items, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    setActive((i) => Math.min(i, Math.max(0, results.length - 1)));
  }, [results.length]);

  useLayoutEffect(() => {
    if (!open || results.length === 0) return;
    const el = document.getElementById(`cmdp-opt-${active}`);
    el?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [active, open, results.length]);

  const go = useCallback(
    (item: CommandPaletteItem) => {
      if (!item.href) return;
      setOpen(false);
      router.push(item.href);
    },
    [router]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        const row = results[active];
        if (row?.href) {
          e.preventDefault();
          go(row);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, active, results, go]);

  const modal = open ? (
    <div
      className="command-palette-backdrop fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        className="command-palette-dialog flex max-h-[min(560px,85vh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-700/90 bg-zinc-950 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.06]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-2.5 border-b border-zinc-800/90 px-3.5">
          <Search
            className="h-4 w-4 shrink-0 text-zinc-500"
            aria-hidden
          />
          <input
            ref={inputRef}
            id="command-palette-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, subjects, chapters…"
            className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            aria-autocomplete="list"
            aria-controls="command-palette-results"
            aria-activedescendant={
              results[active] ? `cmdp-opt-${active}` : undefined
            }
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {loading && (
            <span className="shrink-0 text-xs text-zinc-500">Loading…</span>
          )}
        </div>
        <ul
          id="command-palette-results"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
          role="listbox"
          aria-label="Results"
        >
          {results.length === 0 && loaded && !loading && (
            <li className="px-3 py-10 text-center text-sm text-zinc-500">
              {items.length === 0
                ? "Nothing in your workspace yet."
                : "No matches."}
            </li>
          )}
          {results.map((item, idx) => {
            const Icon =
              item.kind === "subject"
                ? Library
                : item.kind === "chapter"
                  ? BookMarked
                  : FileText;
            const disabled = !item.href;
            const isActive = idx === active;
            return (
              <li key={item.key} role="presentation">
                <button
                  type="button"
                  id={`cmdp-opt-${idx}`}
                  role="option"
                  aria-selected={isActive}
                  aria-disabled={disabled}
                  disabled={disabled}
                  onClick={() => go(item)}
                  onMouseEnter={() => setActive(idx)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-[background-color,box-shadow] duration-150 ease-out",
                    disabled && "cursor-not-allowed opacity-45",
                    !disabled &&
                      isActive &&
                      "bg-violet-500/[0.14] shadow-[inset_0_0_0_1px_rgba(139,92,246,0.35)]",
                    !disabled &&
                      !isActive &&
                      "hover:bg-zinc-800/70"
                  )}
                >
                  <Icon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      isActive ? "text-violet-400" : "text-zinc-500"
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="truncate font-medium text-zinc-100">
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-[10px] font-semibold uppercase tracking-wide",
                          isActive ? "text-violet-300/90" : "text-zinc-500"
                        )}
                      >
                        {item.kind}
                      </span>
                    </div>
                    <p className="truncate text-xs text-zinc-400">
                      {item.meta}
                    </p>
                    {item.snippet ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-zinc-500">
                        {item.snippet}
                      </p>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="shrink-0 border-t border-zinc-800/90 px-3.5 py-2.5 text-[10px] text-zinc-500">
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-zinc-400">
                ↑↓
              </kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-zinc-400">
                ↵
              </kbd>{" "}
              open
            </span>
            <span>
              <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-zinc-400">
                esc
              </kbd>{" "}
              close
            </span>
          </span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-500 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 sm:px-3"
        aria-label="Open command palette"
        aria-keyshortcuts="Meta+K Control+K"
        aria-haspopup="dialog"
      >
        <Search className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:inline dark:border-zinc-600 dark:bg-zinc-900">
          ⌘K
        </kbd>
      </button>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
