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
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type WikiLinkItem = {
  noteId: string;
  title: string;
  chapterTitle: string;
  subjectName: string;
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

    const itemIds = items.map((i) => i.noteId).join("\0");
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
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSelected((s) => (itemsRef.current.length ? Math.max(0, s - 1) : 0));
          return true;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelected((s) =>
            itemsRef.current.length
              ? Math.min(itemsRef.current.length - 1, s + 1)
              : 0
          );
          return true;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const item = itemsRef.current[selectedRef.current];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="slash-command-floating w-[min(320px,calc(100vw-24px))] rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-500 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {query.trim() ? "No matching notes." : "Type to search notes…"}
        </div>
      );
    }

    return (
      <div className="slash-command-floating w-[min(320px,calc(100vw-24px))] max-h-[min(280px,40vh)] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <p className="border-b border-zinc-100 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          Link to note
        </p>
        <ul className="max-h-[220px] overflow-y-auto py-0.5" role="listbox">
          {items.map((item, index) => (
            <li key={item.noteId} role="none">
              <button
                type="button"
                role="option"
                ref={index === selected ? activeItemRef : undefined}
                aria-selected={index === selected}
                className={cn(
                  "flex w-full items-start gap-2 px-2.5 py-2 text-left text-sm transition-colors",
                  index === selected
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                )}
                onClick={() => command(item)}
              >
                <FileText
                  className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {item.title?.trim() || "Untitled"}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {item.subjectName} · {item.chapterTitle}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);
