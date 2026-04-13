"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FuseResult } from "fuse.js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { snippetAroundFirstMatch } from "@/lib/fuse-highlight-utils";
import type { SidebarSearchableNote } from "@/lib/sidebar-note-search";
import { matchKeyName } from "@/lib/sidebar-note-search";
import { HighlightedText } from "./HighlightedText";

function indicesForField(
  matches: FuseResult<SidebarSearchableNote>["matches"],
  field: string
): [number, number][] {
  if (!matches?.length) return [];
  const hit = matches.find((m) => matchKeyName(m.key) === field);
  if (!hit?.indices?.length) return [];
  return hit.indices.map(([a, b]) => [a, b] as [number, number]);
}

type Props = {
  results: FuseResult<SidebarSearchableNote>[];
};

export function SidebarSearchResults({ results }: Props) {
  const pathname = usePathname();

  return (
    <ScrollArea className="h-full min-h-[140px] max-h-[min(320px,calc(100vh-14rem))]">
      <ul className="space-y-1 pb-2 pr-3" role="listbox" aria-label="Search results">
        {results.map((r) => {
          const item = r.item;
          const href = item.href;
          const titleIdx = indicesForField(r.matches, "title");
          const contentIdx = indicesForField(r.matches, "contentPlain");
          const snippet = snippetAroundFirstMatch(
            item.contentPlain,
            contentIdx.length ? contentIdx : []
          );
          const active = href ? pathname.startsWith(href) : false;

          const inner = (
            <>
              <span className="block truncate text-[13px] font-medium text-zinc-800 dark:text-zinc-100">
                <HighlightedText text={item.title} ranges={titleIdx} />
              </span>
              <span className="mt-0.5 block line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                {snippet.text ? (
                  <HighlightedText
                    text={snippet.text}
                    ranges={snippet.highlightRanges}
                  />
                ) : (
                  <span className="italic opacity-80">No body text</span>
                )}
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                {item.subjectName} · {item.chapterTitle}
              </span>
            </>
          );

          if (!href) {
            return (
              <li
                key={item.noteId}
                className="rounded-md px-2 py-1.5 text-left opacity-60"
                role="option"
              >
                {inner}
              </li>
            );
          }

          return (
            <li key={item.noteId} role="option">
              <Link
                href={href}
                className={cn(
                  "block rounded-md px-2 py-1.5 text-left transition-colors",
                  active
                    ? "bg-zinc-200/90 dark:bg-zinc-800"
                    : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/70"
                )}
              >
                {inner}
              </Link>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
