"use client";

import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import { Suggestion } from "@tiptap/suggestion";
import { NoteLink } from "./note-link-extension";
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

  const w = 300;
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

async function fetchNoteSuggestions(
  query: string,
  excludeNoteId: string
): Promise<WikiLinkItem[]> {
  const url = new URL("/api/notes/search", window.location.origin);
  url.searchParams.set("q", query);
  if (excludeNoteId.trim().length > 0) {
    url.searchParams.set("exclude", excludeNoteId);
  }
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = (await res.json()) as { notes: WikiLinkItem[] };
    return Array.isArray(data.notes) ? data.notes : [];
  } catch {
    return [];
  }
}

export type WikiLinkExtensionOptions = {
  excludeNoteId: string;
};

export const WikiLinkExtension = Extension.create<WikiLinkExtensionOptions>({
  name: "wikiLinkSuggestion",

  addOptions() {
    return {
      excludeNoteId: "",
    };
  },

  addExtensions() {
    return [NoteLink];
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const { excludeNoteId } = this.options;

    let component: ReactRenderer<WikiLinkMenuHandle> | null = null;
    let updatePosition: (() => void) | null = null;
    let latestClientRect: (() => DOMRect | null) | null = null;

    return [
      Suggestion({
        pluginKey: wikiLinkPluginKey,
        editor,
        char: "[",
        allowSpaces: true,
        allowedPrefixes: ["["],
        decorationClass: "wiki-link-decoration",
        command: ({ editor: ed, range, props }) => {
          const item = props as WikiLinkItem;
          ed.chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "text",
              text: item.title,
              marks: [
                {
                  type: "noteLink",
                  attrs: {
                    noteId: item.id,
                    label: item.title,
                  },
                },
              ],
            })
            .run();
        },
        items: ({ query }) =>
          fetchNoteSuggestions(query, excludeNoteId || "none"),
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === "codeBlock") {
              return false;
            }
          }
          return true;
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
              editor
                .chain()
                .focus()
                .deleteRange(keyProps.range)
                .run();
              return true;
            }

            return component?.ref?.onKeyDown(keyProps) ?? false;
          },
        }),
      }),
    ];
  },
});
