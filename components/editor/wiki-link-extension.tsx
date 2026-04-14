"use client";

import { Extension } from "@tiptap/core";
import type { ResolvedPos } from "@tiptap/pm/model";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import { Suggestion } from "@tiptap/suggestion";
import { NOTE_LINK_MARK } from "@/lib/note-content-links";
import {
  WikiLinkMenu,
  type WikiLinkItem,
  type WikiLinkMenuHandle,
} from "./WikiLinkMenu";

export const wikiLinkPluginKey = new PluginKey("wikiLink");

function positionWikiMenu(
  element: HTMLElement,
  getRect: () => DOMRect | null
) {
  const rect = getRect();
  if (!rect) return;

  const w = 320;
  const margin = 8;
  let top = rect.bottom + margin;
  let left = rect.left;

  const estHeight = Math.min(element.offsetHeight || 240, 320);
  if (top + estHeight > window.innerHeight - margin) {
    top = rect.top - estHeight - margin;
  }
  if (left + w > window.innerWidth - margin) {
    left = window.innerWidth - w - margin;
  }

  element.style.position = "fixed";
  element.style.left = `${Math.max(margin, left)}px`;
  element.style.top = `${Math.max(margin, top)}px`;
  element.style.zIndex = "250";
}

export function findWikiLinkMatch(config: {
  $position: ResolvedPos;
}): { range: { from: number; to: number }; query: string; text: string } | null {
  const { $position } = config;
  const start = $position.start();
  const textBefore = $position.doc.textBetween(start, $position.pos, "\0", "\0");
  const m = textBefore.match(/\[\[([^\]]*)$/);
  if (!m) return null;
  const full = m[0];
  const from = $position.pos - full.length;
  return {
    range: { from, to: $position.pos },
    query: m[1] ?? "",
    text: full,
  };
}

export type WikiLinkExtensionOptions = {
  /** Current note id (excluded from search). */
  currentNoteId: string;
};

export const WikiLinkExtension = Extension.create<WikiLinkExtensionOptions>({
  name: "wikiLink",

  addOptions() {
    return {
      currentNoteId: "",
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const { currentNoteId } = this.options;

    let component: ReactRenderer<WikiLinkMenuHandle> | null = null;
    let updatePosition: (() => void) | null = null;
    let latestClientRect: (() => DOMRect | null) | null = null;

    return [
      Suggestion({
        pluginKey: wikiLinkPluginKey,
        editor,
        char: "[",
        allowSpaces: true,
        allowedPrefixes: [" ", "\n", "\0"],
        startOfLine: false,
        findSuggestionMatch: (opts) =>
          findWikiLinkMatch({ $position: opts.$position }),
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === "codeBlock") {
              return false;
            }
          }
          return true;
        },
        command: ({ editor: ed, range, props }) => {
          const item = props as WikiLinkItem;
          const label = item.title?.trim() || "Untitled";
          ed.chain()
            .focus()
            .deleteRange({ from: range.from, to: range.to })
            .insertContent({
              type: "text",
              text: label,
              marks: [
                {
                  type: NOTE_LINK_MARK,
                  attrs: { noteId: item.noteId },
                },
              ],
            })
            .insertContent(" ")
            .run();
        },
        items: async ({ query }) => {
          const params = new URLSearchParams();
          if (query.trim()) params.set("q", query.trim());
          if (currentNoteId) params.set("exclude", currentNoteId);
          try {
            const res = await fetch(`/api/notes/link-search?${params}`);
            if (!res.ok) return [];
            const data = (await res.json()) as { notes?: WikiLinkItem[] };
            return data.notes ?? [];
          } catch {
            return [];
          }
        },
        render: () => ({
          onStart: (props) => {
            latestClientRect = props.clientRect ?? null;

            component = new ReactRenderer(WikiLinkMenu, {
              editor: props.editor,
              props: {
                items: props.items as WikiLinkItem[],
                query: props.query,
                command: (item: WikiLinkItem) => {
                  props.command(item);
                },
              },
            });

            component.element.classList.add("wiki-link-floating");

            updatePosition = () => {
              if (!component) return;
              positionWikiMenu(
                component.element as HTMLElement,
                () => latestClientRect?.() ?? null
              );
            };

            updatePosition();
            window.addEventListener("scroll", updatePosition, true);
            window.addEventListener("resize", updatePosition);

            document.body.appendChild(component.element);
          },

          onUpdate: (props) => {
            latestClientRect = props.clientRect ?? null;

            component?.updateProps({
              items: props.items as WikiLinkItem[],
              query: props.query,
              command: (item: WikiLinkItem) => {
                props.command(item);
              },
            });

            requestAnimationFrame(() => updatePosition?.());
          },

          onExit: () => {
            if (updatePosition) {
              window.removeEventListener("scroll", updatePosition, true);
              window.removeEventListener("resize", updatePosition);
            }
            updatePosition = null;
            latestClientRect = null;
            component?.destroy();
            component = null;
          },

          onKeyDown: (keyProps) => {
            if (keyProps.event.key === "Escape") {
              keyProps.event.preventDefault();
              editor.chain().focus().deleteRange(keyProps.range).run();
              return true;
            }

            return component?.ref?.onKeyDown(keyProps) ?? false;
          },
        }),
      }),
    ];
  },
});
