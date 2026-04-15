"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { SuggestionKeyDownProps } from "@tiptap/suggestion";
import { StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

export type WikiLinkItem = {
  id: string;
  title: string;
  href: string;
};

export type WikiLinkMenuHandle = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

type Props = {
  items: WikiLinkItem[];
  query: string;
  command: (item: WikiLinkItem) => void;
};

export const WikiLinkMenu = forwardRef<WikiLinkMenuHandle, Props>(
  function WikiLinkMenu({ items, query, command }, ref) {
    const [selected, setSelected] = useState(0);
    const itemsRef = useRef(items);
    const selectedRef = useRef(0);
    const queryPrev = useRef(query);
    const activeItemRef = useRef<HTMLButtonElement | null>(null);
    itemsRef.current = items;
    selectedRef.current = selected;

    useEffect(() => {
      if (queryPrev.current !== query) {
        queryPrev.current = query;
        setSelected(0);
      }
    }, [query]);

    const itemIds = items.map((i) => i.id).join("\0");
    useEffect(() => {
      setSelected((i) => {
        if (items.length === 0) return 0;
        return Math.min(i, items.length - 1);
      });
    }, [itemIds, items.length]);

    useLayoutEffect(() => {
      activeItemRef.current?.scrollIntoView({
        block: "nearest",
        behavior: "auto",
      });
    }, [selected, items.length]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        const list = itemsRef.current;
        if (list.length === 0) return false;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelected((i) => (i + 1) % list.length);
          return true;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSelected((i) => (i + list.length - 1) % list.length);
          return true;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          const item = list[selectedRef.current];
          if (item) command(item);
          return true;
        }

        return false;
      },
    }));

    const shellClass = cn(
      "wiki-link-menu-shell max-h-[min(320px,50vh)] w-[min(300px,calc(100vw-16px))] overflow-hidden rounded-xl border py-1 shadow-2xl",
      "border-zinc-200/90 bg-white/95 backdrop-blur-md",
      "dark:border-zinc-600/90 dark:bg-zinc-900/95"
    );

    if (items.length === 0) {
      return (
        <div className={shellClass} role="listbox">
          <div
            className={cn(
              "px-3 py-4 text-center text-[13px]",
              "text-zinc-500 dark:text-zinc-400"
            )}
          >
            {query.trim().length > 0 ? "No notes match" : "Type to search notes"}
          </div>
        </div>
      );
    }

    return (
      <div
        className={shellClass}
        role="listbox"
        aria-label="Link to note"
        aria-activedescendant={`wiki-link-${items[selected]?.id ?? ""}`}
      >
        <div className="wiki-link-menu-scroll max-h-[min(308px,calc(50vh-12px))] overflow-y-auto overflow-x-hidden px-1">
          {items.map((item, index) => {
            const active = index === selected;
            return (
              <button
                key={item.id}
                id={`wiki-link-${item.id}`}
                ref={active ? activeItemRef : undefined}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] transition-[background-color,color,transform] duration-100 ease-out",
                  active
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/70"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => command(item)}
                onMouseEnter={() => setSelected(index)}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-100",
                    active
                      ? "bg-white text-zinc-700 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  )}
                >
                  <StickyNote className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 font-medium leading-tight">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
